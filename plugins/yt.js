// instagram.com/noureddine_ouafy
// • Scrape YTMP4 Downloader
// • Author : SaaOfc's

import axios from 'axios'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, args }) => {
  if (!args[0]) throw '⚠️ أرسل رابط يوتيوب صالح!\n\nمثال: .yt https://youtube.com/watch?v=xxxxxxxxxxx'
  let url = args[0]
  const selectedQuality = '360p'

  m.reply('⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy')

  try {
    const info = await getVideoInfo(url)

    const res = await axios.post(`https://api.ytmp4.fit/api/download`, { url, quality: selectedQuality }, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream',
        'Origin': 'https://ytmp4.fit',
        'Referer': 'https://ytmp4.fit/',
      }
    })

    if (!res.headers['content-type'].includes('video')) {
      throw new Error('فشل التحميل')
    }

    const filename = decodeURIComponent(
      (res.headers['content-disposition'] || '').split("filename*=UTF-8''")[1] || `video_${selectedQuality}.mp4`
    ).replace(/[\/\\:*?"<>|]/g, '_')

    const filepath = path.join('./tmp', filename)
    fs.writeFileSync(filepath, res.data)

    await conn.sendFile(m.chat, fs.readFileSync(filepath), filename, `🎬 ${info.title}\n📺 ${info.channel}\n⏱️ ${info.duration}`, m)
    fs.unlinkSync(filepath)
  } catch (err) {
    m.reply('❌ حدث خطأ أثناء التحميل: ' + err.message)
  }
}

handler.help = ['yt']
handler.tags = ['downloader']
handler.command = ['yt']
handler.limit = true
export default handler

async function getVideoInfo(url) {
  const { data } = await axios.post(`https://api.ytmp4.fit/api/video-info`, { url }, {
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://ytmp4.fit',
      'Referer': 'https://ytmp4.fit/'
    }
  })
  if (!data || !data.title) throw new Error('❌ فشل جلب معلومات الفيديو.')
  return data
}
