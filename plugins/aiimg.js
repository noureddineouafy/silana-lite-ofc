// plugin by noureddine ouafy 
// scrape by ( i don't remember 😐)

import crypto from 'crypto'
import CryptoJS from 'crypto-js'

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`

const APP_ID = "aifaceswap"
const U_ID = "1H5tRtzsBkqXcaJ"

const generateRandomString = (len) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const aesenc = (data, key) => {
  const k = CryptoJS.enc.Utf8.parse(key)
  return CryptoJS.AES.encrypt(data, k, { iv: k, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString()
}

const rsaenc = (data) => crypto.publicEncrypt(
  { key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
  Buffer.from(data, 'utf8')
).toString('base64')

const gencryptoheaders = (type, fp = null) => {
  const n = Math.floor(Date.now() / 1000)
  const r = crypto.randomUUID()
  const i = generateRandomString(16)
  const fingerPrint = fp || crypto.randomBytes(16).toString('hex')
  const s = rsaenc(i)
  const signStr = type === 'upload' ? `${APP_ID}:${r}:${s}` : `${APP_ID}:${U_ID}:${n}:${r}:${s}`
  return {
    'fp': fingerPrint,
    'fp1': aesenc(`${APP_ID}:${fingerPrint}`, i),
    'x-guide': s,
    'x-sign': aesenc(signStr, i),
    'x-code': Date.now().toString()
  }
}

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Accept': 'application/json, text/plain, */*',
  'origin': 'https://live3d.io',
  'referer': 'https://live3d.io/',
  'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q'
}

const createJob = async (prompt, aspectRatio = '1:1') => {
  const cryptoHeaders = gencryptoheaders('create')
  const res = await fetch('https://app.live3d.io/aitools/of/create', {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json', ...cryptoHeaders },
    body: JSON.stringify({
      fn_name: 'demo-image-editor',
      call_type: 3,
      input: {
        model: 'nano_banana_pro',
        source_images: [],
        prompt,
        aspect_radio: aspectRatio,
        request_from: 9
      },
      data: '',
      request_from: 9,
      origin_from: '8f3f0c7387123ae0'
    })
  })
  const data = await res.json()
  return { taskId: data.data.task_id, fp: cryptoHeaders.fp }
}

const cekjob = async (taskId, fp) => {
  const cryptoHeaders = gencryptoheaders('check', fp)
  const res = await fetch('https://app.live3d.io/aitools/of/check-status', {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json', ...cryptoHeaders },
    body: JSON.stringify({
      task_id: taskId,
      fn_name: 'demo-image-editor',
      call_type: 3,
      request_from: 9,
      origin_from: '8f3f0c7387123ae0'
    })
  })
  const data = await res.json()
  return data.data
}

const live3dGen = async (prompt, aspectRatio = '1:1') => {
  const { taskId, fp } = await createJob(prompt, aspectRatio)

  let result
  do {
    await new Promise(r => setTimeout(r, 4000))
    result = await cekjob(taskId, fp)
  } while (result.status !== 2)

  return 'https://temp.live3d.io/' + result.result_image
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`❌ Please enter a prompt!\n\nExample:\n.aiimg cute sleeping cat`)
  }

  try {
    await m.reply('⏳ Generating image, please wait...')

    const url = await live3dGen(text)

    await conn.sendMessage(m.chat, {
      image: { url },
      caption: `✅ Image generated!\n\n📝 Prompt: ${text}`
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    m.reply('❌ Failed to generate image.')
  }
}

handler.help = ['aiimg']
handler.command = ['aiimg']
handler.tags = ['ai']
handler.limit = true

export default handler
