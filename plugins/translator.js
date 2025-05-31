// instagram.com/noureddine_ouafy
import axios from 'axios'
import cheerio from 'cheerio'

let handler = async (m, { text, args, usedPrefix, command }) => {
  try {
    if (!text) {
      return m.reply(`Please use this command like:\n${usedPrefix + command} <language_code> | <text>`)
    }

    const [lang, ...rest] = text.split('|')
    const textToTranslate = rest.join('|').trim()
    const targetLang = lang.trim()

    if (!targetLang || !textToTranslate) {
      return m.reply(`Missing parameters!\nUsage example:\n${usedPrefix + command} en | Bonjour`)
    }

    const apiUrl = 'https://api.stringtranslate.com/string'
    const randomId = Math.random().toString(36).substring(2, 15)

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': 'https://stringtranslate.com/'
    }

    const requestBody = {
      text: textToTranslate,
      lang: targetLang,
      id: randomId
    }

    const response = await axios.post(apiUrl, requestBody, { headers })

    const $ = cheerio.load(response.data)
    const translated = $('#text').text().trim()

    if (!translated) {
      return m.reply('Failed to extract translated text.')
    }

    await conn.sendMessage(m.chat, { text: translated }, { quoted: m })
    
  } catch (e) {
    console.error(e)
    await m.reply('Failed to connect to translation server. Please try again later.')
  }
}

handler.help = ['translator']
handler.tags = ['tools']
handler.command = /^translator$/i
handler.limit = true;
export default handler
