/*
- Name : Mosyne AI
- Description : Remove background or upscale images using mosyne.ai
- Follow : https://whatsapp.com/channel/0029Vb6D8o67YSd1UzflqU1d
- re-edit by noureddine ouafy
- Source : https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C/3854
*/

import axios from 'axios'
import FormData from 'form-data'

// Upload image to Uguu.se and return the public URL
async function uploadUguu(buffer, filename = 'image.jpg') {
  const form = new FormData()
  form.append('files[]', buffer, { filename })

  const { data } = await axios.post('https://uguu.se/upload.php', form, {
    headers: form.getHeaders()
  })

  const url = data?.files?.[0]?.url
  if (!url) throw new Error('Failed to upload to Uguu.')
  return url
}

// Remove background using Mosyne AI
async function removeBackgroundMosyne(buffer) {
  const imageUrl = await uploadUguu(buffer)
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'origin': 'https://mosyne.ai',
    'referer': 'https://mosyne.ai/ai/remove-bg',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)'
  }
  const user_id = 'user_test'

  const { data: uploadRes } = await axios.post(
    'https://mosyne.ai/api/remove_background',
    { image: imageUrl, user_id },
    { headers }
  )

  const id = uploadRes.id
  if (!id) throw new Error('Failed to get process ID.')

  const checkPayload = { id, type: 'remove_background', user_id }
  const delay = ms => new Promise(res => setTimeout(res, ms))

  for (let i = 0; i < 30; i++) {
    await delay(2000)
    const { data: statusRes } = await axios.post(
      'https://mosyne.ai/api/status',
      checkPayload,
      { headers }
    )

    if (statusRes.status === 'COMPLETED' && statusRes.image) {
      return statusRes.image
    }
    if (statusRes.status === 'FAILED') {
      throw new Error('Background removal failed.')
    }
  }
  throw new Error('Timeout while processing background removal.')
}

// Upscale image using Mosyne AI
async function upscaleMosyne(buffer) {
  const imageUrl = await uploadUguu(buffer)
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'origin': 'https://mosyne.ai',
    'referer': 'https://mosyne.ai/ai/upscaling',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)'
  }
  const user_id = 'user_test'

  const { data: uploadRes } = await axios.post(
    'https://mosyne.ai/api/upscale',
    { image: imageUrl, user_id },
    { headers }
  )

  const id = uploadRes.id
  if (!id) throw new Error('Failed to get process ID.')

  const checkPayload = { id, type: 'upscale', user_id }
  const delay = ms => new Promise(res => setTimeout(res, ms))

  for (let i = 0; i < 30; i++) {
    await delay(2000)
    const { data: statusRes } = await axios.post(
      'https://mosyne.ai/api/status',
      checkPayload,
      { headers }
    )

    if (statusRes.status === 'COMPLETED' && statusRes.image) {
      return statusRes.image
    }
    if (statusRes.status === 'FAILED') {
      throw new Error('Upscale process failed.')
    }
  }
  throw new Error('Timeout while processing upscaling.')
}

let handler = async (m, { conn, args }) => {
  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    
    if (!mime.startsWith('image/')) {
      return m.reply('Please reply to an image.\n\n*Example:*\n.mosyne hd (Upscale)\n.mosyne rbg (Remove Background)')
    }

    const subcommand = args[0]?.toLowerCase()

    if (!subcommand) {
      return m.reply('Please choose a valid subcommand:\n\n• rbg - Remove Background\n• hd - Upscale Image')
    }

    m.reply('Please wait...')

    const buffer = await q.download()

    switch (subcommand) {
      case 'rbg':
        const bgResult = await removeBackgroundMosyne(buffer)
        await conn.sendMessage(m.chat, { image: { url: bgResult } }, { quoted: m })
        break

      case 'hd':
        const hdResult = await upscaleMosyne(buffer)
        await conn.sendMessage(m.chat, { image: { url: hdResult } }, { quoted: m })
        break

      default:
        m.reply('Invalid subcommand.\n\n• rbg - Remove Background\n• hd - Upscale Image')
    }
  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['mosyne']
handler.command = ['mosyne']
handler.tags = ['tools']
handler.limit = true
export default handler
