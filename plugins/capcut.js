// instagram.com/noureddine_ouafy
// scrape by  Ponta Sensei
import axios from 'axios'

let handler = async (m, { conn, args }) => {
  const url = args[0]
  if (!url) return m.reply('📌 من فضلك أرسل رابط CapCut:\nمثال:\n.capcut https://www.capcut.com/t/Zs8mRY2Xp/')

  const res = await Ponta3Bic(url)
  if (!res) return m.reply('❌ فشل في جلب الفيديو. تأكد من الرابط أو أعد المحاولة لاحقاً.')

  await conn.sendFile(m.chat, res.video, 'capcut.mp4', `🎬 *${res.title}*\n\n📸 *By:* ${res.author}`, m)
}

handler.help = ['capcut']
handler.command = ['capcut']
handler.tags = ['downloader']
handler.limit = true
export default handler

// ===== 🔽 FUNCTION: CapCut Scraper from 3bic.com
const Ponta3Bic = async (url) => {
  try {
    const response = await axios.post('https://3bic.com/api/download', {
      url: url
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://3bic.com',
        'Referer': 'https://3bic.com/id',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
      }
    })

    const res = response.data
    if (res.code !== 200) throw new Error('فشل في تحميل البيانات.')

    return {
      title: res.title,
      video: 'https://3bic.com' + res.originalVideoUrl,
      thumbnail: res.coverUrl,
      author: res.authorName
    }
  } catch (err) {
    console.error('❌ Error scraping:', err.message)
    return null
  }
}
