// Instagram: noureddine_ouafy
// Plugin: Ghibli Anime Style
// Description: تحويل الصورة لستايل أنمي من Studio Ghibli
// scrape by nbscript
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import path from 'path'

const ghibli = {
  api: {
    base: 'https://api.code12.cloud',
    endpoints: {
      paygate: (slug) => `/app/paygate-oauth${slug}`,
      ghibli: (slug) => `/app/v2/ghibli/user-image${slug}`,
    },
  },

  creds: {
    appId: 'DKTECH_GHIBLI_Dktechinc',
    secretKey: 'r0R5EKF4seRwqUIB8gLPdFvNmPm8rN63',
  },

  studios: [
    'ghibli-howl-moving-castle-anime',
    'ghibli-spirited-away-anime',
    'ghibli-my-neighbor-totoro-anime',
    'ghibli-ponyo-anime',
    'ghibli-grave-of-fireflies-anime',
    'ghibli-princess-mononoke-anime',
    'ghibli-kaguya-anime',
  ],

  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept-encoding': 'gzip',
  },

  db: './db.json',

  log: (...args) => console.log(...args),

  readDB: () => {
    try {
      return JSON.parse(fs.readFileSync(ghibli.db, 'utf-8'))
    } catch {
      return null
    }
  },

  writeDB: (data) => fs.writeFileSync(ghibli.db, JSON.stringify(data, null, 2), 'utf-8'),

  getStudioId: (id) => {
    if (typeof id === 'number' && ghibli.studios[id]) return ghibli.studios[id]
    if (typeof id === 'string' && ghibli.studios.includes(id)) return id
    return null
  },

  getNewToken: async () => {
    try {
      const url = `${ghibli.api.base}${ghibli.api.endpoints.paygate('/token')}`

      const res = await axios.post(
        url,
        { appId: ghibli.creds.appId, secretKey: ghibli.creds.secretKey },
        {
          headers: { ...ghibli.headers, 'content-type': 'application/json' },
          validateStatus: () => true,
        }
      )

      if (res.status !== 200 || res.data?.status?.code !== '200') {
        return {
          success: false,
          code: res.status || 500,
          result: { error: res.data?.status?.message || 'فشل الحصول على التوكن 😅' },
        }
      }

      const { token, tokenExpire, encryptionKey } = res.data.data
      ghibli.writeDB({ token, tokenExpire, encryptionKey })

      return { success: true, code: 200, result: { token, tokenExpire, encryptionKey } }
    } catch (err) {
      return { success: false, code: err?.response?.status || 500, result: { error: err.message } }
    }
  },

  getToken: async () => {
    const db = ghibli.readDB()
    const now = Date.now()

    if (db && db.token && db.tokenExpire && now < db.tokenExpire) {
      ghibli.log('✅ استخدام التوكن المخزن مسبقاً...')
      return { success: true, code: 200, result: db }
    }

    ghibli.log('♻️ التوكن منتهي أو غير موجود، جاري إنشاء توكن جديد...')
    return await ghibli.getNewToken()
  },

  generate: async ({ studio, filePath }) => {
    const studioId = ghibli.getStudioId(studio)
    if (!studioId) {
      return {
        success: false,
        code: 400,
        result: {
          error: `معرف الاستوديو غير صحيح. استخدم رقم من 0 إلى ${ghibli.studios.length - 1}\nالقائمة:\n${ghibli.studios
            .map((id, i) => `[${i}] ${id}`)
            .join(', ')}`,
        },
      }
    }

    if (!filePath || filePath.trim() === '' || !fs.existsSync(filePath)) {
      return { success: false, code: 400, result: { error: 'الصورة غير موجودة 🗿' } }
    }

    try {
      const toket = await ghibli.getToken()
      if (!toket.success) return toket

      const { token } = toket.result
      const form = new FormData()
      form.append('studio', studioId)
      form.append('file', fs.createReadStream(filePath), {
        filename: filePath.split('/').pop(),
        contentType: 'image/jpeg',
      })

      const url = `${ghibli.api.base}${ghibli.api.endpoints.ghibli('/edit-theme')}?uuid=1212`
      const res = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          ...ghibli.headers,
          authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })

      if (res.status !== 200 || res.data?.status?.code !== '200') {
        return {
          success: false,
          code: res.status || 500,
          result: { error: res.data?.status?.message || res.data?.message || `${res.status}` },
        }
      }

      const { imageId, imageUrl, imageOriginalLink } = res.data.data
      return { success: true, code: 200, result: { imageId, imageUrl, imageOriginalLink } }
    } catch (err) {
      return { success: false, code: err?.response?.status || 500, result: { error: err.message } }
    }
  },
}

// ✅ Handler Plugin
let handler = async (m, { conn, args }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!mime || !mime.startsWith('image/'))
    return m.reply('📸 المرجو الرد على صورة لإتمام التحويل.')

  // قائمة الاستوديوهات مع الأرقام لتوضيح الاختيار للمستخدم
  let studioList = ghibli.studios.map((name, i) => `[${i}] ${name}`).join('\n')

  let studioIndex = parseInt(args[0])
  if (isNaN(studioIndex) || studioIndex < 0 || studioIndex >= ghibli.studios.length) {
    return m.reply(
      `❗ المرجو تحديد رقم الاستوديو الصحيح.\n\nالاستوديوهات المتاحة:\n${studioList}\n\nمثال: .ghibli 2`
    )
  }

  m.reply('⏳ جاري تحويل الصورة لستايل Ghibli 🎨')

  // تحميل الصورة
  const buffer = await q.download()
  const tempFilePath = `./tmp/ghibli_${Date.now()}.jpg`
  fs.writeFileSync(tempFilePath, buffer)

  let result = await ghibli.generate({ studio: studioIndex, filePath: tempFilePath })

  fs.unlinkSync(tempFilePath)

  if (!result.success) return m.reply(`❌ خطأ: ${result.result.error}`)

  await conn.sendFile(
    m.chat,
    result.result.imageUrl,
    'ghibli.jpg',
    `✨ الاستوديو: ${ghibli.studios[studioIndex]}`,
    m
  )
}

handler.help = ['ghibli']
handler.tags = ['ai']
handler.command = ['ghibli']
handler.limit = true

export default handler
