// @instagram: noureddine_ouafy
import axios from 'axios'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Readable } from 'stream'
import sharp from 'sharp'

function randomIP() {
  return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.')
}

function randomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Android 12; Mobile; rv:102.0) Gecko/102.0 Firefox/102.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
  ]
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

const sessionIP = randomIP()
const sessionUA = randomUserAgent()

function getBaseHeaders() {
  return {
    'fp': 'c74f54010942b009eaa50cd58a1f4419',
    'fp1': '3LXezMA2LSO2kESzl2EYNEQBUWOCDQ/oQMQaeP5kWWHbtCWoiTptGi2EUCOLjkdD',
    'origin': 'https://pixnova.ai',
    'referer': 'https://pixnova.ai/',
    'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q',
    'x-code': '1752930995556',
    'x-guide': 'SjwMWX+LcTqkoPt48PIOgZzt3eQ93zxCGvzs1VpdikRR9b9+HvKM0Qiceq6Zusjrv8bUEtDGZdVqjQf/bdOXBb0vEaUUDRZ29EXYW0kt047grMMceXzd3zppZoHZj9DeXZOTGaG50PpTHxTjX3gb0D1wmfjol2oh7d5jJFSIsY0=',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'accept': 'application/json, text/plain, */*',
    'user-agent': sessionUA,
    'X-Forwarded-For': sessionIP,
    'Client-IP': sessionIP
  }
}

async function uploadImageFromBuffer(buffer) {
  const stream = Readable.from(buffer)
  const form = new FormData()
  form.append('file', stream, { filename: 'image.jpg' })
  form.append('fn_name', 'demo-photo2anime')
  form.append('request_from', '2')
  form.append('origin_from', '111977c0d5def647')

  const upload = await axios.post('https://api.pixnova.ai/aitools/upload-img', form, {
    headers: {
      ...getBaseHeaders(),
      ...form.getHeaders()
    }
  })
  return upload.data?.data?.path
}

async function createTask(sourceImage) {
  const payload = {
    fn_name: 'demo-photo2anime',
    call_type: 3,
    input: {
      source_image: sourceImage,
      strength: 0.6,
      prompt: 'use anime style, hd, 8k, smooth, aesthetic',
      negative_prompt: '(worst quality, low quality:1.4), (greyscale, monochrome:1.1), cropped, lowres , username, blurry, trademark, watermark, title, multiple view, Reference sheet, curvy, plump, fat, strabismus, clothing cutout, side slit,worst hand, (ugly face:1.2), extra leg, extra arm, bad foot, text, name',
      request_from: 2
    },
    request_from: 2,
    origin_from: '111977c0d5def647'
  }

  const headers = {
    ...getBaseHeaders(),
    'content-type': 'application/json'
  }

  const res = await axios.post('https://api.pixnova.ai/aitools/of/create', payload, { headers })
  return res.data?.data?.task_id
}

async function waitForResult(taskId) {
  const payload = {
    task_id: taskId,
    fn_name: 'demo-photo2anime',
    call_type: 3,
    request_from: 2,
    origin_from: '111977c0d5def647'
  }

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  for (let i = 1; i <= 30; i++) {
    const headers = {
      ...getBaseHeaders(),
      'content-type': 'application/json'
    }

    const check = await axios.post('https://api.pixnova.ai/aitools/of/check-status', payload, { headers })
    const data = check.data?.data
    if (data?.status === 2 && data?.result_image) {
      const url = data.result_image.startsWith('http')
        ? data.result_image
        : `https://oss-global.pixnova.ai/${data.result_image}`
      return url
    }
    await delay(2000)
  }

  return null
}

async function convertToPNG(url) {
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  const webpBuffer = Buffer.from(arrayBuffer)
  const pngBuffer = await sharp(webpBuffer).png().toBuffer()
  return pngBuffer
}

// 🧠 handler
let handler = async (m, { conn }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''

  if (!/image\/(jpe?g|png|webp)/.test(mime)) {
    return m.reply('📌 من فضلك رد على صورة لاستخدام هذا الأمر.\n\nمثال:\n.photo2anime')
  }

  const buffer = await q.download()
  m.reply('🎨 يتم تحويل صورتك إلى أنمي، المرجو الانتظار...')

  try {
    const sourceImage = await uploadImageFromBuffer(buffer)
    const taskId = await createTask(sourceImage)
    const resultUrl = await waitForResult(taskId)

    if (!resultUrl) return m.reply('❌ فشل في توليد الصورة على شكل أنمي.')

    const pngBuffer = await convertToPNG(resultUrl)

    await conn.sendFile(m.chat, pngBuffer, 'anime.png', '✨ ها هي صورتك بعد التحويل إلى أنمي!', m)
  } catch (e) {
    console.error('❌ خطأ:', e)
    m.reply('❌ حدث خطأ أثناء معالجة الصورة.')
  }
}

handler.help = ['photo2anime']
handler.tags = ['ai']
handler.command = ['photo2anime']
handler.limit = true

export default handler
