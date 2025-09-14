/*
* Instagram: noureddine_ouafy
* Base: https://freeimage.host/
* Author: Shannz
*/

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const freeimage = {
  getToken: async () => {
    try {
      const response = await axios.get('https://freeimage.host/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
      })
      const htmlContent = response.data
      const regex = /PF\.obj\.config\.auth_token = "([a-f0-9]+)"/
      const match = htmlContent.match(regex)

      if (match && match[1]) {
        return match[1]
      } else {
        throw new Error("Failed to find auth_token in the page.")
      }
    } catch (error) {
      throw new Error(`Failed to get token: ${error.message}`)
    }
  },
  upload: async (filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`)
    }
    
    try {
      const authToken = await freeimage.getToken()
      const data = new FormData()
      data.append('source', fs.createReadStream(filePath))
      data.append('type', 'file')
      data.append('action', 'upload')
      data.append('timestamp', Date.now().toString())
      data.append('auth_token', authToken)

      const config = {
        method: 'POST',
        url: 'https://freeimage.host/json',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
          'Accept': 'application/json',
          'Origin': 'https://freeimage.host',
          'Referer': 'https://freeimage.host/',
          ...data.getHeaders()
        },
        data: data
      }
      
      const response = await axios.request(config)
      return response.data
    } catch (error) {
      let errorMessage = `Upload failed: ${error.message}`
      if (error.response) {
        errorMessage += ` - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      }
      throw new Error(errorMessage)
    }
  }
}

// ===== Handler =====
let handler = async (m, { conn }) => {
  if (!m.quoted) throw "❌ Please reply to an image."

  let mime = (m.quoted.msg || m.quoted).mimetype || ''
  if (!/image/.test(mime)) throw "❌ The replied message is not an image."

  let media = await m.quoted.download()
  let filePath = path.join('./tmp', Date.now() + '.jpg')
  fs.writeFileSync(filePath, media)

  try {
    let result = await freeimage.upload(filePath)
    if (result && result.image && result.image.url) {
      await conn.reply(m.chat, `✅ Uploaded successfully!\n\n🔗 ${result.image.url}`, m)
    } else {
      await conn.reply(m.chat, "❌ Upload failed, no URL returned.", m)
    }
  } catch (e) {
    await conn.reply(m.chat, `❌ Error: ${e.message}`, m)
  } finally {
    fs.unlinkSync(filePath) // delete temp file
  }
}

handler.help = ['uploadimage']
handler.tags = ['uploader']
handler.command = ['uploadimage']
handler.limit = true

export default handler
