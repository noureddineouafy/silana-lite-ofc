import { createHash } from 'crypto'
import axios from 'axios'
import https from 'https'

/* ============================================================
   🔧 Kiana-Chan YouTube Downloader — Core Scraper
   API: https://tools.kiana-chan.fun
   Supports: MP4 (HD / 360p / 480p / 720p / 1080p)
============================================================ */

const BASE_URL = 'https://tools.kiana-chan.fun'

const client = axios.create({
  baseURL: BASE_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    minVersion: 'TLSv1.2'
  }),
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'origin': BASE_URL,
    'referer': `${BASE_URL}/youtube`,
    'user-agent': 'Mozilla/5.0 (Linux; Android 10) Chrome/137 Mobile'
  },
  timeout: 30000
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

function generateToken(challengeId = 'c1') {
  const ts = Date.now()
  const payload = `captcha-ok:${challengeId}:${ts}`
  const hash = createHash('sha256').update(payload).digest('hex')
  return `${challengeId}.${ts}.${hash.slice(0, 16)}`
}

async function getInfo(url) {
  const turnstileToken = generateToken()
  await sleep(900)
  const res = await client.post('/api/info', { url, turnstileToken })
  if (!res.data?.video_formats?.length) throw new Error('No video formats found')
  return res.data
}

function pickFormat(formats, quality) {
  if (!quality || quality === 'HD') return formats[0]
  return formats.find(f => f.quality?.includes(String(quality))) || formats[0]
}

async function enqueue(token) {
  const res = await client.post('/api/enqueue', { token })
  if (!res.data?.job_id) throw new Error('Failed to get job_id')
  return res.data.job_id
}

async function waitJob(jobId, { retries = 20, delay = 3000 } = {}) {
  for (let i = 0; i < retries; i++) {
    await sleep(delay)
    const res = await client.get(`/api/job/${jobId}`)
    const { status, download_url } = res.data
    if (status === 'done') {
      return download_url?.startsWith('http')
        ? download_url
        : `${BASE_URL}${download_url}`
    }
    if (status === 'failed') throw new Error('Job processing failed')
  }
  throw new Error('Timeout: job did not finish in time')
}

async function kianaDL(url, quality = 'HD') {
  const info = await getInfo(url)
  const format = pickFormat(info.video_formats, quality)
  const jobId = await enqueue(format.dl_token)
  const downloadUrl = await waitJob(jobId)
  return {
    title: info.title,
    thumbnail: info.thumbnail || null,
    quality: format.quality,
    download: downloadUrl
  }
}

/* ============================================================
   🤖 Bot Handler
   Commands: ytdl | ytvideo | kianayt
============================================================ */

let handler = async (m, { conn, args, usedPrefix, command }) => {

  // ─── Show guide if no arguments ───────────────────────────
  if (!args[0]) {
    return m.reply(`
╭─────────────────────────╮
│  🎬 *YouTube Downloader*  │
╰─────────────────────────╯

*What is this?*
Download YouTube videos directly to WhatsApp as MP4 files using a fast cloud processor.

*How to use:*
\`${usedPrefix}${command} <YouTube URL> [quality]\`

*Available qualities:*
• \`HD\` — Best available (default)
• \`360p\` — Low quality, small size
• \`480p\` — Medium quality
• \`720p\` — HD quality
• \`1080p\` — Full HD (large file)

*Examples:*
\`${usedPrefix}${command} https://youtu.be/xxxxx\`
\`${usedPrefix}${command} https://youtu.be/xxxxx 720p\`

⚠️ *Note:* Processing may take 15–60 seconds depending on video length.
`.trim())
  }

  // ─── Validate URL ──────────────────────────────────────────
  const url = args[0]
  const isYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)
  if (!isYouTubeUrl) {
    return m.reply('❌ Invalid URL. Please send a valid YouTube link.\n\nExample: https://youtu.be/xxxxx')
  }

  const quality = args[1]?.toUpperCase() || 'HD'
  const validQualities = ['HD', '360P', '480P', '720P', '1080P']
  if (!validQualities.includes(quality)) {
    return m.reply(`❌ Invalid quality *"${args[1]}"*\n\nChoose from: HD, 360p, 480p, 720p, 1080p`)
  }

  // ─── Processing ────────────────────────────────────────────
  await m.reply(`⏳ *Processing your video...*\n\n🔗 URL: ${url}\n🎞 Quality: ${quality}\n\nPlease wait, this may take up to 60 seconds.`)

  try {
    const result = await kianaDL(url, quality === 'HD' ? 'HD' : quality.toLowerCase())

    const caption = `✅ *Download Ready!*

📌 *Title:* ${result.title}
🎞 *Quality:* ${result.quality}

_Powered by Silana Bot 🤖_`

    await conn.sendFile(
      m.chat,
      result.download,
      `${result.title.replace(/[^\w\s-]/gi, '').trim() || 'video'}.mp4`,
      caption,
      m
    )

  } catch (err) {
    const msg = err.message || 'Unknown error'

    // Friendly error messages
    if (msg.includes('Timeout')) {
      return m.reply('⏱ *Timeout!* The video took too long to process. Try again or use a shorter video.')
    }
    if (msg.includes('format')) {
      return m.reply('❌ No downloadable formats found for this video. It may be age-restricted or private.')
    }

    m.reply(`❌ *Failed to download*\n\n_${msg}_\n\nTry again or use a different quality.`)
  }
}

handler.help = ['kiana-yt']
handler.tags = ['downloader']
handler.command = ['kiana-yt']
handler.limit = true
export default handler
