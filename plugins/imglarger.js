// @instagram.com/noureddine_ouafy
// Plugin: Upscale image using ImgLarger API
// scrape by rynn hub
import axios from 'axios'
import FormData from 'form-data'

async function imglarger(buffer, options = {}) {
  const { scale = '2', type = 'upscale' } = options

  const config = {
    scales: ['2', '4'],
    types: { upscale: 13, enhance: 2, sharpener: 1 }
  }

  if (!Buffer.isBuffer(buffer)) throw new Error('Image buffer is required')
  if (!config.types[type]) throw new Error(`Available types: ${Object.keys(config.types).join(', ')}`)
  if (type === 'upscale' && !config.scales.includes(scale.toString())) throw new Error(`Available scales: ${config.scales.join(', ')}`)

  const form = new FormData()
  form.append('file', buffer, `img_${Date.now()}.jpg`)
  form.append('type', config.types[type].toString())
  if (type !== 'sharpener') form.append('scaleRadio', type === 'upscale' ? scale.toString() : '1')

  const { data: p } = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
    headers: {
      ...form.getHeaders(),
      accept: 'application/json, text/plain, */*',
      origin: 'https://imglarger.com',
      referer: 'https://imglarger.com/',
      'user-agent': 'Mozilla/5.0'
    }
  })

  if (!p.data.code) throw new Error('Upload failed - no code received')

  while (true) {
    const { data: r } = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', {
      code: p.data.code,
      type: config.types[type]
    }, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        origin: 'https://imglarger.com',
        referer: 'https://imglarger.com/',
        'user-agent': 'Mozilla/5.0'
      }
    })

    if (r.data.status === 'waiting') continue
    if (r.data.status === 'success') return r.data.downloadUrls[0]
    await new Promise(res => setTimeout(res, 5000))
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.quoted || !/image/.test(m.quoted.mimetype)) {
    return m.reply(`📸 أرسل صورة ثم رد عليها باستخدام:\n${usedPrefix + command} [upscale|enhance|sharpener] [scale 2|4]\n\nمثال:\n${usedPrefix + command} upscale 4`)
  }

  let q = m.quoted
  let mime = q.mimetype || ''
  let img = await q.download()

  let type = args[0] || 'upscale'
  let scale = args[1] || '2'

  m.reply('⏳ المرجو الانتظار قليلاً، يتم الآن تحسين الصورة...')

  try {
    let result = await imglarger(img, { type, scale })
    await conn.sendFile(m.chat, result, 'upscaled.jpg', `✅ تمت المعالجة باستخدام ImgLarger (${type})`, m)
  } catch (e) {
    m.reply('❌ حدث خطأ: ' + e.message)
  }
}

handler.help = ['imglarger']
handler.tags = ['tools']
handler.command = ['imglarger']
handler.limit = true
export default handler
