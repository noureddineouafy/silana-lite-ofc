// plugin by instagram.com/noureddine_ouafy
import crypto from "crypto"
import axios from "axios"

class SaveTube {
  constructor() {
    this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12'
    this.m = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/
    this.is = axios.create({
      headers: {
        'content-type': 'application/json',
        'origin': 'https://yt.savetube.me',
        'user-agent': 'Mozilla/5.0 (Android 15; Mobile)'
      }
    })
  }

  async decrypt(enc) {
    const buf = Buffer.from(enc, 'base64')
    const key = Buffer.from(this.ky, 'hex')
    const iv = buf.slice(0, 16)
    const data = buf.slice(16)

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ])

    return JSON.parse(decrypted.toString())
  }

  async getCdn() {
    const res = await this.is.get("https://media.savetube.vip/api/random-cdn")
    return { status: true, data: res.data.cdn }
  }

  async download(url) {
    const id = url.match(this.m)?.[3]
    if (!id) throw "Invalid YouTube URL"

    const cdn = await this.getCdn()
    const info = await this.is.post(`https://${cdn.data}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${id}`
    })

    const dec = await this.decrypt(info.data.data)

    const dl = await this.is.post(`https://${cdn.data}/download`, {
      id,
      downloadType: 'audio',
      quality: '128',
      key: dec.key
    })

    return {
      title: dec.title,
      duration: dec.duration,
      thumb: dec.thumbnail,
      download: dl.data.data.downloadUrl
    }
  }
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return m.reply(
      `❌ Usage:\n.ytmp3 <youtube_url>\n\nExample:\n.ytmp3 https://youtu.be/U2vyax9Uufc`
    )
  }

  const url = args[0]
  const st = new SaveTube()

  try {
    m.reply("⏳ Downloading audio...")

    const res = await st.download(url)

    let caption = `
🎵 *Title:* ${res.title}
⏱ *Duration:* ${res.duration}
📦 *Format:* MP3
`

    await conn.sendMessage(m.chat, {
      audio: { url: res.download },
      mimetype: 'audio/mpeg',
      fileName: `${res.title}.mp3`,
      caption
    }, { quoted: m })

  } catch (e) {
    m.reply(`❌ Error: ${e}`)
  }
}

handler.help = ['ytmp3']
handler.command = ['ytmp3']
handler.tags = ['downloader']
handler.limit = true

export default handler
