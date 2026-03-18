// plugin by noureddine ouafy 
// scrape by 🚀CodeTeam 

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

async function getAuthToken() {
  const { data } = await axios.get('https://freeimage.host/')
  const token = data.match(/auth_token\s*=\s*"(.+?)"/)?.[1]
  if (!token) throw 'Auth token not found'
  return token
}

async function uploadImage(path) {
  const token = await getAuthToken()

  const form = new FormData()
  form.append('source', fs.createReadStream(path))
  form.append('type', 'file')
  form.append('action', 'upload')
  form.append('timestamp', Date.now().toString())
  form.append('auth_token', token)

  const { data } = await axios.post('https://freeimage.host/json', form, {
    headers: {
      ...form.getHeaders(),
      accept: 'application/json'
    }
  })

  return {
    status: data.status_code,
    url: data.image.url,
    viewer: data.image.url_viewer
  }
}

let handler = async (m, { conn }) => {
  try {
    if (!m.quoted) {
      return m.reply(`❌ Please reply to an image you want to upload.`)
    }

    const mime = m.quoted.mimetype || ''
    if (!mime.startsWith('image/')) {
      return m.reply(`❌ The replied file must be an image.`)
    }

    // Download image
    const media = await m.quoted.download()
    const filePath = `./temp_${Date.now()}.jpg`

    fs.writeFileSync(filePath, media)

    // Upload to Freeimage.host
    const result = await uploadImage(filePath)

    // Remove temp file
    fs.unlinkSync(filePath)

    // Send result
    await m.reply(
      `✅ *Upload Successful!*\n\n` +
      `📎 Direct URL:\n${result.url}\n\n` +
      `🔗 Viewer Link:\n${result.viewer}`
    )

  } catch (e) {
    console.error(e)
    m.reply(`❌ Error: ${e}`)
  }
}

handler.help = ['uploadimg']
handler.command = ['uploadimg']
handler.tags = ['uploader']
handler.limit = true

export default handler
