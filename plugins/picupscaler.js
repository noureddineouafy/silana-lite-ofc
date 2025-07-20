/*
 * Instagram: noureddine_ouafy
 * Feature: Upscale image by replying to a photo
 * Usage: Reply to a photo with .picupscaler
 * scrape by GilangSan
 */

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'

const upscale = async (buffer) => {
  if (!buffer) return { error: 'No image buffer received' }

  try {
    const tempPath = path.join(tmpdir(), `${Date.now()}.png`)
    fs.writeFileSync(tempPath, buffer)

    let form = new FormData()
    form.append('image', fs.createReadStream(tempPath))
    form.append('user_id', '')
    form.append('is_public', 'false')

    const { data } = await axios.post('https://picupscaler.com/api/generate/handle', form, {
      headers: {
        ...form.getHeaders(),
        Origin: 'https://picupscaler.com',
        Referer: 'https://picupscaler.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })

    fs.unlinkSync(tempPath)
    return data
  } catch (e) {
    return { error: e.message }
  }
}

let handler = async (m, { conn }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/image/.test(mime)) return m.reply('❌ Please reply to an image')

  m.reply('🔄 Uploading image and processing...')

  try {
    const media = await q.download()
    const result = await upscale(media)

    if (result?.image_path) {
      await conn.sendFile(m.chat, result.image_path, 'upscaled.png', '✅ Done! Image has been upscaled.', m)
    } else if (result?.url) {
      await conn.sendFile(m.chat, result.url, 'uploaded.png', `✅ Image uploaded.\n⚠️ Processing not completed on server.\n🔗 You can view or download it here:\n${result.url}`, m)
    } else {
      m.reply('❌ Failed to upscale image.\n' + JSON.stringify(result, null, 2))
    }
  } catch (e) {
    m.reply('❌ Error: ' + e.message)
  }
}

handler.help = ['picupscaler']
handler.tags = ['tools']
handler.command = ['picupscaler']
handler.limit = true

export default handler
