// instagram.com/noureddine_ouafy
// scrape by CR Ponta Sensei WEB https://codeteam.my.id
import axios from 'axios'
import * as cheerio from 'cheerio'

const scrapeSavetik = async (tiktokUrl) => {
  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://savetik.co',
      'Referer': 'https://savetik.co/id/tiktok-mp3-downloader',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
      'X-Requested-With': 'XMLHttpRequest'
    }

    const data = new URLSearchParams()
    data.append('q', tiktokUrl)
    data.append('lang', 'id')

    const res = await axios.post('https://savetik.co/api/ajaxSearch', data, { headers })
    const $ = cheerio.load(res.data.data)

    const title = $('h3').text()
    const thumbnail = $('.thumbnail img').attr('src')
    const buttons = $('a.tik-button-dl')
    const results = {}

    const isPhoto = $('.photo-list .download-items__btn a').length > 0

    if (isPhoto) {
      const images = []
      $('.photo-list .download-items__btn a').each((_, el) => {
        const link = $(el).attr('href')
        if (link) images.push(link)
      })
      const audio = $('a').filter((_, el) => $(el).text().includes('Unduh MP3')).attr('href') || ''
      return {
        type: 'photo',
        title,
        thumbnail,
        audio,
        images
      }
    } else {
      buttons.each((_, el) => {
        const text = $(el).text().toLowerCase()
        const href = $(el).attr('href')
        if (text.includes('mp3')) results.mp3 = href
        else if (text.includes('hd')) results.video_hd = href
        else if (text.includes('mp4')) results.video_sd = href
      })
      return {
        type: 'video',
        title,
        thumbnail,
        ...results
      }
    }
  } catch (err) {
    console.error('❌ Gagal scraping:', err.message)
    return null
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('📌 أرسل رابط فيديو تيك توك مثل:\n.tiktok https://vm.tiktok.com/xyz123')

  const result = await scrapeSavetik(args[0])
  if (!result) return m.reply('❌ فشل الحصول على البيانات.')

  if (result.type === 'photo') {
    await conn.sendMessage(m.chat, { image: { url: result.thumbnail }, caption: `📸 ${result.title}` }, { quoted: m })
    for (let img of result.images) {
      await conn.sendFile(m.chat, img, 'photo.jpg', null, m)
    }
    if (result.audio) await conn.sendFile(m.chat, result.audio, 'audio.mp3', null, m)
  } else {
    let caption = `🎬 ${result.title}\n\n`
    if (result.video_hd) {
      caption += '🎥 فيديو HD'
      await conn.sendFile(m.chat, result.video_hd, 'video.mp4', caption, m)
    } else if (result.video_sd) {
      caption += '🎥 فيديو SD'
      await conn.sendFile(m.chat, result.video_sd, 'video.mp4', caption, m)
    }
    if (result.mp3) {
      await conn.sendFile(m.chat, result.mp3, 'audio.mp3', '🎵 الصوت من الفيديو', m)
    }
  }
}

handler.help = ['savetik']
handler.command = ['savetik']
handler.tags = ['downloader']
handler.limit = true

export default handler
