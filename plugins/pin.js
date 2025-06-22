// instagram.com/noureddine_ouafy
//scrape by SaaOffc
import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, args }) => {
  const url = args[0]
  if (!url) return m.reply('📌 أرسل رابط منشور Pinterest مثل:\n.pin https://pin.it/xxxx')

  const result = await snappinDownload(url)
  if (!result.status) return m.reply('❌ فشل في تحميل المحتوى: ' + result.message)

  if (result.video) {
    await conn.sendFile(m.chat, result.video, 'video.mp4', '🎥 تم تحميل الفيديو من Pinterest', m)
  } else if (result.image) {
    await conn.sendFile(m.chat, result.image, 'image.jpg', '🖼️ تم تحميل الصورة من Pinterest', m)
  } else {
    m.reply('❌ لم يتم العثور على صورة أو فيديو في هذا الرابط.')
  }
}

handler.help = ['pin']
handler.command = ['pin']
handler.tags = ['downloader']
handler.limit = true
export default handler

// ===== 🔽 FUNCTION: Snappin Scraper
export async function snappinDownload(pinterestUrl) {
  try {
    const { csrfToken, cookies } = await getSnappinToken()

    const postRes = await axios.post(
      'https://snappin.app/',
      { url: pinterestUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: cookies,
          Referer: 'https://snappin.app',
          Origin: 'https://snappin.app',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    const $ = cheerio.load(postRes.data)
    const thumb = $('img').attr('src')

    const downloadLinks = $('a.button.is-success')
      .map((_, el) => $(el).attr('href'))
      .get()

    let videoUrl = null
    let imageUrl = null

    for (const link of downloadLinks) {
      const fullLink = link.startsWith('http') ? link : 'https://snappin.app' + link

      const head = await axios.head(fullLink).catch(() => null)
      const contentType = head?.headers?.['content-type'] || ''

      if (link.includes('/download-file/')) {
        if (contentType.includes('video')) {
          videoUrl = fullLink
        } else if (contentType.includes('image')) {
          imageUrl = fullLink
        }
      } else if (link.includes('/download-image/')) {
        imageUrl = fullLink
      }
    }

    return {
      status: true,
      thumb,
      video: videoUrl,
      image: videoUrl ? null : imageUrl
    }

  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || 'Unknown Error'
    }
  }
}

async function getSnappinToken() {
  const { headers, data } = await axios.get('https://snappin.app/')
  const cookies = headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
  const $ = cheerio.load(data)
  const csrfToken = $('meta[name="csrf-token"]').attr('content')
  return { csrfToken, cookies }
      }
