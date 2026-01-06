// plugin by instagram.com/noureddine_ouafy
// scrape by fathurweb

import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import FormData from 'form-data'
import path from 'path'
import { fileURLToPath } from 'url'

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
const BASE_URL = 'https://api.deepai.org'

/* ===== DeepAI Key Generator ===== */
function getMD5Reversed(input) {
  const hash = crypto.createHash('md5').update(input).digest('hex')
  return hash.split("").reverse().join("")
}

function generateApiKey() {
  const randomStr = Math.round(Math.random() * 100000000000).toString()
  const salt = 'hackers_become_a_little_stinkier_every_time_they_hack'

  const h1 = getMD5Reversed(UA + randomStr + salt)
  const h2 = getMD5Reversed(UA + h1)
  const h3 = getMD5Reversed(UA + h2)

  return `tryit-${randomStr}-${h3}`
}

/* ===== DeepAI Colorizer ===== */
async function colorizer(filePath) {
  const apiKey = generateApiKey()

  const uploadForm = new FormData()
  uploadForm.append('file', fs.createReadStream(filePath))

  const upload = await axios.post(
    `${BASE_URL}/upload-temp-blob`,
    uploadForm,
    {
      headers: {
        ...uploadForm.getHeaders(),
        'User-Agent': UA,
        'Referer': 'https://deepai.org/',
        'Origin': 'https://deepai.org'
      }
    }
  )

  if (!upload.data?.blob_ref) {
    throw 'Failed to upload image'
  }

  const processForm = new FormData()
  processForm.append('image', upload.data.blob_ref)
  processForm.append('image_generator_version', 'standard')

  const result = await axios.post(
    `${BASE_URL}/api/colorizer`,
    processForm,
    {
      headers: {
        ...processForm.getHeaders(),
        'api-key': apiKey,
        'User-Agent': UA,
        'Referer': 'https://deepai.org/',
        'Origin': 'https://deepai.org'
      }
    }
  )

  return result.data
}

/* ===== Bot Handler ===== */
let handler = async (m, { conn }) => {
  try {
    if (!m.quoted || !m.quoted.mimetype?.includes('image')) {
      return m.reply(
        '❌ Please reply to a black & white image with this command.\n\nExample:\nReply image → .colorize_v2'
      )
    }

    m.reply('🎨 Processing image, please wait...')

    const media = await m.quoted.download()
    const tempFile = path.join('./tmp', `${Date.now()}.jpg`)
    fs.writeFileSync(tempFile, media)

    const result = await colorizer(tempFile)
    fs.unlinkSync(tempFile)

    if (!result?.output_url) {
      return m.reply('❌ Failed to colorize image.')
    }

    await conn.sendFile(
      m.chat,
      result.output_url,
      'colorized.jpg',
      '✅ *Image successfully colorized!*',
      m
    )

  } catch (err) {
    console.error(err)
    m.reply('⚠️ An error occurred while processing the image.')
  }
}

handler.help = ['colorize_v2']
handler.command = ['colorize_v2']
handler.tags = ['ai']
handler.limit = true

export default handler
