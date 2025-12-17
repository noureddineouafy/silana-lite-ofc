// scrape by hannuniverse
// plugin by noureddine ouafy

import axios from 'axios'

class YouTubeDownloader {
  constructor() {
    this.baseUrl = 'https://p.savenow.to'
    this.headers = {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://y2down.cc/',
      Origin: 'https://y2down.cc'
    }
  }

  async request(url, format) {
    const res = await axios.get(`${this.baseUrl}/ajax/download.php`, {
      params: {
        copyright: '0',
        format,
        url,
        api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
      },
      headers: this.headers
    })

    if (!res.data?.progress_url) return null

    return {
      progress: res.data.progress_url,
      title: res.data.info?.title || 'YouTube Video'
    }
  }

  async wait(progressUrl) {
    for (let i = 0; i < 60; i++) {
      const res = await axios.get(progressUrl, { headers: this.headers })
      if (res.data?.download_url) return res.data.download_url
      await new Promise(r => setTimeout(r, 2000))
    }
    return null
  }

  async download(url, format) {
    const req = await this.request(url, format)
    if (!req) return null

    const dl = await this.wait(req.progress)
    if (!dl) return null

    return {
      downloadUrl: dl,
      title: req.title
    }
  }
}

/* ================= HELPERS ================= */

function cleanFileName(text) {
  return text
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sendGuide(m) {
  return m.reply(`
📥 *YouTube Downloader*

Download YouTube videos directly.

📌 *Usage*
.ytdl <youtube_url> [quality]

🎥 *Video qualities*
144, 240, 320, 480, 720, 1080, 1440, 4k

⭐ *Default quality*
720p (if not specified)

🧪 *Examples*
.ytdl https://youtu.be/9zvdMLfYFkM
.ytdl https://youtu.be/9zvdMLfYFkM 480
.ytdl https://youtube.com/watch?v=9zvdMLfYFkM 1080

⚠️ *Notes*
• Large videos may be sent as a download link
• WhatsApp size limits apply
• File name will match the video title
`.trim())
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, args }) => {
  if (!args[0]) return sendGuide(m)

  const url = args[0]
  const format = args[1] || '720'

  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return sendGuide(m)
  }

  await conn.reply(m.chat, '⏳ Processing, please wait...', m)

  const ytdl = new YouTubeDownloader()
  const data = await ytdl.download(url, format)

  if (!data)
    throw '❌ Failed to download the video. Please try another quality.'

  // check size first
  const head = await axios.head(data.downloadUrl)
  const sizeMB = Number(head.headers['content-length'] || 0) / (1024 * 1024)

  if (sizeMB > 95) {
    return conn.reply(
      m.chat,
      `❌ File is too large for WhatsApp (${sizeMB.toFixed(1)} MB)

🔗 Download it here:
${data.downloadUrl}`,
      m
    )
  }

  const fileRes = await axios.get(data.downloadUrl, {
    responseType: 'arraybuffer'
  })

  const buffer = Buffer.from(fileRes.data)

  const safeTitle = cleanFileName(data.title)

  await conn.sendMessage(
    m.chat,
    {
      document: buffer,
      mimetype: 'video/mp4',
      fileName: `${safeTitle}.mp4`
    },
    { quoted: m }
  )
}

handler.help = handler.command = ['ytdl']
handler.tags = ['downloader']
handler.limit = true

export default handler
