// 📌 Feature: Screenshot Website
// ✍️ Creator: xyzan code - Anomaki Team
// 📎 Source: https://whatsapp.com/channel/0029Vaio4dYC1FuGr5kxfy2l
// ❗ لا تحذف حقوق المطور
// plugin by noureddine ouafy
import axios from 'axios'

async function ssweb(url) {
  const headers = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json',
    'origin': 'https://imagy.app',
    'priority': 'u=1, i',
    'referer': 'https://imagy.app/',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
  }

  const body = {
    url: url,
    browserWidth: 1280,
    browserHeight: 720,
    fullPage: false,
    deviceScaleFactor: 1,
    format: 'png'
  }

  try {
    const res = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', body, { headers })
    return {
      id: res.data.id,
      fileUrl: res.data.fileUrl,
      success: true
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    throw `📸 Usage:\n${usedPrefix + command} https://example.com`
  }

  let url = args[0]
  if (!url.startsWith('http')) throw '❗ Please provide a valid URL with http/https.'

  m.reply('🔄 Please wait, taking a screenshot...')

  let result = await ssweb(url)

  if (!result.success) {
    throw '❌ Failed to capture screenshot.\n' + result.error
  }

  await conn.sendFile(m.chat, result.fileUrl, 'screenshot.png', `🖼️ Screenshot of:\n${url}`, m)
}

handler.help = ['createscreenshot']
handler.tags = ['tools']
handler.command = ['createscreenshot']
handler.limit = true

export default handler
