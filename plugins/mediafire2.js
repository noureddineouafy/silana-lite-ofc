// scrape by haan 
// plugin by noureddine ouafy
import axios from 'axios'
import cheerio from 'cheerio'
import { URL } from 'url'

/* ================= MEDIAFIRE SCRAPER ================= */

class MediaFireDownloader {
  constructor() {
    this.axios = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    })
  }

  async extract(mediafireUrl) {
    const res = await this.axios.get(mediafireUrl)
    const $ = cheerio.load(res.data)

    const selectors = [
      '#downloadButton',
      'a.input.popsok',
      '.download_link a.input'
    ]

    for (const s of selectors) {
      const btn = $(s)
      if (btn.length && btn.attr('href')) {
        let url = btn.attr('href')
        if (url.startsWith('//')) url = 'https:' + url

        let filename = this._getFilename($, url)
        let filesize = this._getFilesize(btn)

        return {
          filename,
          downloadUrl: url,
          filesize
        }
      }
    }
    return null
  }

  _getFilename($, downloadUrl) {
    const meta = $('meta[property="og:title"]').attr('content')
    if (meta) return meta.trim()

    try {
      const u = new URL(downloadUrl)
      return decodeURIComponent(u.pathname.split('/').pop())
    } catch {
      return 'file'
    }
  }

  _getFilesize(el) {
    const match = el.text().match(/\(([0-9.]+\s*[KMGT]?B)\)/i)
    return match ? match[1] : null
  }
}

/* ================= HELPERS ================= */

function fixFilename(filename, downloadUrl) {
  filename = filename?.trim() || 'file'

  // already has extension
  if (/\.[a-z0-9]+$/i.test(filename)) return filename

  // extract extension from URL
  const extMatch = downloadUrl.match(/\.([a-z0-9]+)(?:\?|$)/i)
  if (extMatch) {
    return `${filename}.${extMatch[1]}`
  }

  return filename
}

function getMimeFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase()

  const map = {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    apk: 'application/vnd.android.package-archive',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  }

  return map[ext] || 'application/octet-stream'
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, args }) => {
  if (!args[0])
    throw '❌ Please provide a MediaFire link.\n\nExample:\n.mediafire https://www.mediafire.com/file/...'

  if (!args[0].includes('mediafire.com'))
    throw '❌ Invalid MediaFire URL.'

  await conn.reply(m.chat, '⏳ Downloading file, please wait...', m)

  const mf = new MediaFireDownloader()
  const data = await mf.extract(args[0])

  if (!data) throw '❌ Failed to extract MediaFire link.'

  // 🔽 Download file
  const res = await axios.get(data.downloadUrl, {
    responseType: 'arraybuffer',
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })

  const buffer = Buffer.from(res.data)

  // 🔥 Fix filename & mimetype
  const fixedName = fixFilename(data.filename, data.downloadUrl)
  const mimetype = getMimeFromFilename(fixedName)

  // 📤 Send as document (safe for all formats)
  await conn.sendMessage(
    m.chat,
    {
      document: buffer,
      mimetype,
      fileName: fixedName
    },
    { quoted: m }
  )
}

/* ================= META ================= */

handler.help = ['mediafire2']
handler.command = ['mediafire2']
handler.tags = ['downloader']
handler.limit = true

export default handler
