// instagram.com/noureddine_ouafy
// plugin scrape by rikikangsc2-eng thanks brother 
import axios from 'axios'
import cheerio from 'cheerio'
import { URLSearchParams } from 'url'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const baseUrls = [
    'https://elevenlabs-crack.vercel.app',
    'https://elevenlabs-crack-qyb7.vercel.app',
    'https://elevenlabs-crack-f2zu.vercel.app'
  ]

  let text = args.slice(1).join(" ")
  let model = args[0]

  if (!model) {
    return m.reply(`❌ Missing model.\n\nExample:\n${usedPrefix + command} getList\n\n${usedPrefix + command} bill السلام عليكم`)
  }

  for (let i = 0; i < 3; i++) {
    const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)]

    try {
      if (!text && model === 'getList') {
        const { data: html } = await axios.get(baseUrl + '/')
        const $ = cheerio.load(html)
        const options = $('#ttsForm select[name="model"] option').map((_, el) => $(el).val()).get()
        return m.reply(`📢 Available Models:\n\n${options.join('\n')}`)
      }

      if (!text) {
        return m.reply('❌ Please provide the text to convert to audio.')
      }

      const payload = new URLSearchParams()
      payload.append('model', model)
      payload.append('text', text)

      const response = await axios.post(`${baseUrl}/generate-audio`, payload.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
          'Referer': baseUrl + '/'
        },
        responseType: 'arraybuffer'
      })

      await conn.sendMessage(m.chat, {
        audio: Buffer.from(response.data),
        mimetype: 'audio/mpeg',
        ptt: true
      }, { quoted: m })

      return

    } catch (e) {
      console.log(`❌ Error: ${e.message}`)
    }
  }

  return m.reply('❌ Model not available or temporarily down. Please try again later or contact admin.')
}

handler.help = handler.command = ['elevenlab']
handler.tags = ['ai']
handler.limit = true
export default handler
