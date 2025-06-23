// @noureddine_ouafy
// Scraper Terabox Downloader (Direct Upload)
// Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C

import axios from 'axios'

export async function Terabox(link) {
  try {
    if (!/^https:\/\/(1024)?terabox\.com\/s\//.test(link)) {
      return { error: '❌ الرابط غير صالح! يجب أن يكون من terabox.com أو 1024terabox.com' }
    }

    const res = await axios.post('https://teraboxdownloader.online/api.php',
      { url: link },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://teraboxdownloader.online',
          'Referer': 'https://teraboxdownloader.online/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*'
        }
      }
    )

    const data = res.data
    if (!data?.direct_link) {
      return { error: '❌ لم يتم العثور على رابط التحميل.', debug: data }
    }

    return {
      file_name: data.file_name,
      size: data.size,
      direct_link: data.direct_link
    }

  } catch (err) {
    return { error: '❌ فشل في الوصول إلى الموقع.', detail: err.message }
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('📦 أرسل رابط terabox هكذا:\n.terabox https://terabox.com/s/xxxxx')

  m.reply('⏳ جاري تحميل الفيديو، المرجو الانتظار...')

  const result = await Terabox(args[0])

  if (result.error) {
    return m.reply(result.error)
  }

  try {
    await conn.sendFile(m.chat, result.direct_link, result.file_name, '', m, false, { asDocument: false })
  } catch (e) {
    m.reply('❌ فشل في إرسال الفيديو.\n' + e.message)
  }
}

handler.help = ['terabox']
handler.tags = ['downloader']
handler.command = ['terabox']
handler.limit = true

export default handler
