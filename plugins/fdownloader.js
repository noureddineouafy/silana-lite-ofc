// instagram.com/noureddine_ouafy
import axios from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('⛔ من فضلك أرسل رابط فيسبوك مثل:\n.fdownloader https://www.facebook.com/reel/1056867206504333/?mibextid=3uV0afJdXZMRbblr')

  try {
    const res = await fbDownloader(text)
    if (!res || !res.links || res.links.length === 0) {
      return m.reply('❌ لم يتم العثور على روابط تحميل في هذا الرابط.')
    }

    const randomLink = res.links[Math.floor(Math.random() * res.links.length)]
    if (!randomLink?.link) return m.reply('⚠️ تعذر العثور على رابط فيديو صالح.')

    const caption = `✅ *${res.title}*\n⏱️ *المدة:* ${res.duration || 'غير معروفة'}\n📥 *الجودة:* ${randomLink.quality} (${randomLink.format})`

    await conn.sendFile(m.chat, randomLink.link, 'facebook.mp4', caption, m)
  } catch (err) {
    console.error('[FB DOWNLOADER ERROR]', err)
    let errorMessage = '❌ حدث خطأ أثناء تحميل الفيديو.'

    if (err.message.includes('رابط فيسبوك غير صالح')) {
      errorMessage = '⛔ الرابط غير صالح. تأكد أنه يبدأ بـ:\nhttps://www.facebook.com/reel/\nأو\nhttps://www.facebook.com/share/v/\nأو\nhttps://fb.watch/'
    } else if (err.message.includes('فشل في الحصول على التوكن')) {
      errorMessage = '⚠️ فشل في التحقق من الرابط. حاول مرة أخرى بعد قليل.'
    } else if (err.message.includes('فشل في جلب البيانات')) {
      errorMessage = '⚠️ تعذر جلب البيانات. تأكد أن الفيديو لا يزال موجودًا.'
    }

    m.reply(errorMessage)
  }
}

handler.help = ['fdownloader']
handler.tags = ['downloader']
handler.command = ['fdownloader']
handler.limit = true
export default handler

async function fbDownloader(url) {
  if (
    !/^https:\/\/www\.facebook\.com\/(reel|share\/v|watch)/.test(url) &&
    !/^https:\/\/fb\.watch\//.test(url)
  ) {
    throw new Error('رابط فيسبوك غير صالح')
  }

  const verifyPayload = qs.stringify({ url })
  const verifyRes = await axios.post('https://fdownloader.net/api/userverify', verifyPayload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '/',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })

  const cftoken = verifyRes.data?.token
  if (!cftoken) throw new Error('فشل في الحصول على التوكن')

  const ajaxPayload = qs.stringify({
    k_exp: Math.floor(Date.now() / 1000) + 1800,
    k_token: '4901a847f621da898b5429bf38df6f3a0959738cd4eb52a2bf0cf44b3eb44cad',
    q: url,
    lang: 'id',
    web: 'fdownloader.net',
    v: 'v2',
    w: '',
    cftoken
  })

  const ajaxRes = await axios.post('https://v3.fdownloader.net/api/ajaxSearch', ajaxPayload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '/'
    }
  })

  const { status, data: html } = ajaxRes.data
  if (status !== 'ok' || !html) throw new Error('فشل في جلب البيانات')

  const $ = cheerio.load(html)
  const thumbnail = $('.image-fb img').attr('src') || ''
  const duration = $('.content p').text().trim()
  const title = $('.content h3').text().trim()

  const links = []
  $('a.download-link-fb').each((_, el) => {
    const link = $(el).attr('href')
    const quality = $(el).attr('title')?.replace('Download ', '') || 'غير معروف'
    const format = link?.includes('.mp4') ? 'mp4' : 'غير معروف'
    if (link) links.push({ quality, format, link })
  })

  return {
    status: true,
    title,
    duration,
    thumbnail,
    links
  }
                                   }
