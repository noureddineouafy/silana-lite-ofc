/**
 * [ *ufile uploader Plugin* ]
 * Creator: nath
 * Enhanced: handler format + guide + error handling by noureddine ouafy and claude ai 🙂
 */

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'

// ─── Guide ───────────────────────────────────────────────────────────────────
const GUIDE = `
╔══════════════════════════════════╗
║       📤 UFile.io Uploader       ║
╚══════════════════════════════════╝

*What is this feature?*
Upload any file (image, video, audio, document) to UFile.io and get a shareable download link instantly.

*How to use:*
➤ Send a file (any type) with caption:
   .ufile

➤ Or reply to an existing file/media with:
   .ufile

*Supported file types:*
• 🖼️ Images  — JPG, PNG, GIF, WEBP
• 🎬 Videos  — MP4, MKV, AVI
• 🎵 Audios  — MP3, OGG, WAV
• 📄 Docs    — PDF, DOCX, TXT, ZIP, etc.

*Output example:*
   🔗 https://ufile.io/xxxxxxxx

*Notes:*
• Max file size depends on UFile.io limits
• Uploaded files may expire after a period
• This feature uses a limit — use it wisely!
`.trim()

// ─── Core Functions ───────────────────────────────────────────────────────────
async function getCsrf() {
  const res = await axios.get('https://ufile.io', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    }
  })

  const match = res.data.match(/id="csrf_hash"[^>]*value="([a-f0-9]+)"/)
  if (!match) throw new Error('CSRF token not found. The site structure may have changed.')

  const csrf = match[1]
  const cookies = res.headers['set-cookie'] || []
  const cookieParts = cookies.map(c => c.split(';')[0])
  const cookieStr = cookieParts.join('; ')
  const sessionMatch = cookieStr.match(/_ci_sessions_=([^;]+)/)
  const sessionId = sessionMatch ? sessionMatch[1] : ''
  const cookie = `csrf_cookie_name=${csrf}; ${cookieStr}`

  return { csrf, cookie, sessionId }
}

async function uploadToUfile(filePath) {
  const fileName = path.basename(filePath)
  const fileBuffer = fs.readFileSync(filePath)
  const fileSize = fs.statSync(filePath).size
  const fileExt = path.extname(filePath).replace('.', '') || 'bin'

  const { csrf, cookie, sessionId } = await getCsrf()

  const baseHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*',
    'Origin': 'https://ufile.io',
    'Referer': 'https://ufile.io/',
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
  }

  // Step 1: Select storage
  const storageRes = await axios.post(
    'https://ufile.io/v1/upload/select_storage',
    `csrf_test_name=${csrf}`,
    { headers: baseHeaders }
  )
  const storageBaseUrl = storageRes.data.storageBaseUrl

  // Step 2: Create upload session
  const sessionRes = await axios.post(
    `${storageBaseUrl}v1/upload/create_session`,
    `csrf_test_name=${csrf}&file_size=${fileSize}`,
    { headers: { ...baseHeaders, 'X-Requested-With': undefined } }
  )
  const fuid = sessionRes.data.fuid

  // Step 3: Upload chunk
  const form = new FormData()
  form.append('chunk_index', '1')
  form.append('fuid', fuid)
  form.append('file', fileBuffer, { filename: fileName, contentType: 'application/octet-stream' })

  await axios.post(`${storageBaseUrl}v1/upload/chunk`, form, {
    headers: {
      ...form.getHeaders(),
      'Cookie': cookie,
      'Origin': 'https://ufile.io',
      'Referer': 'https://ufile.io/',
      'User-Agent': baseHeaders['User-Agent']
    }
  })

  // Step 4: Finalise upload
  const finalRes = await axios.post(
    `${storageBaseUrl}v1/upload/finalise`,
    `csrf_test_name=${csrf}&fuid=${fuid}&file_name=${encodeURIComponent(fileName)}&file_type=${fileExt}&total_chunks=1&session_id=${sessionId}`,
    { headers: { ...baseHeaders, 'X-Requested-With': undefined } }
  )

  const data = finalRes.data
  return {
    id:       data.id,
    url:      data.url,
    filename: data.filename,
    size:     data.size,
    type:     data.type,
    expiry:   data.expiry
  }
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = parseInt(bytes)
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(2)} ${units[i]}`
}

// ─── Handler ──────────────────────────────────────────────────────────────────
let handler = async (m, { conn, usedPrefix, command }) => {
  // Show guide if no media attached and not a reply
  const quoted = m.quoted ? m.quoted : m
  const mime   = (quoted.msg || quoted).mimetype || ''

  if (!mime) {
    return conn.sendMessage(m.chat, { text: GUIDE }, { quoted: m })
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  await conn.sendMessage(m.chat, {
    text: '⏳ Uploading your file to UFile.io...\nPlease wait.'
  }, { quoted: m })

  // Determine file extension from mime type
  const mimeToExt = {
    'image/jpeg':      'jpg',
    'image/png':       'png',
    'image/gif':       'gif',
    'image/webp':      'webp',
    'video/mp4':       'mp4',
    'video/mkv':       'mkv',
    'audio/mpeg':      'mp3',
    'audio/ogg':       'ogg',
    'audio/mp4':       'm4a',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
  }

  const ext      = mimeToExt[mime] || mime.split('/')[1] || 'bin'
  const tmpFile  = path.join(tmpdir(), `ufile_${Date.now()}.${ext}`)

  try {
    // Download media buffer from message
    const mediaBuffer = await quoted.download()
    fs.writeFileSync(tmpFile, mediaBuffer)

    const result = await uploadToUfile(tmpFile)

    const reply = `
✅ *File uploaded successfully!*

📄 *Filename :* ${result.filename || 'Unknown'}
📦 *Size     :* ${formatSize(result.size)}
🗂️ *Type     :* ${result.type || ext.toUpperCase()}
⏳ *Expires  :* ${result.expiry || 'Not specified'}
🔗 *Link     :* ${result.url}
`.trim()

    await conn.sendMessage(m.chat, { text: reply }, { quoted: m })
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error('[UFile Upload Error]', err.message)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.sendMessage(m.chat, {
      text: `❌ *Upload failed.*\n\nReason: ${err.message}\n\nPlease try again later.`
    }, { quoted: m })
  } finally {
    // Always clean up temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  }
}

handler.help = ['ufile']
handler.tags = ['uploader']
handler.command = /^ufile$/i
handler.limit = true
export default handler
