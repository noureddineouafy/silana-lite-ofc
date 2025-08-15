// instagram.com/noureddine_ouafy
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type' // Corrected import

let handler = async (m, { conn, command }) => {
  if (global.db.data.users[m.sender].limit < 1) {
    return conn.sendMessage(m.chat, { text: '⚠️ You do not have enough limit to use this command.' }, { quoted: m })
  }

  const q = m.quoted || m
  const mimetype = (q.msg || q).mimetype || q.mediaType || ''
  if (!mimetype) {
    return conn.sendMessage(m.chat, { text: `📌 Please send or reply to a media file with the caption *${command}*` }, { quoted: m })
  }

  const media = await q.download()
  const tempDir = './temp'
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

  const fileName = `media_${Date.now()}.jpg`
  const filePath = path.join(tempDir, fileName)
  fs.writeFileSync(filePath, media)

  const buffer = fs.readFileSync(filePath)
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  async function uploadToSupa(buffer) {
    try {
      const form = new FormData()
      form.append('file', buffer, 'upload.jpg')
      const res = await axios.post('https://i.supa.codes/api/upload', form, {
        headers: form.getHeaders()
      })
      return res.data?.link || null
    } catch (e) {
      console.error('Supa Error:', e.message)
      return null
    }
  }

  async function uploadToTmpFiles(filePath) {
    try {
      const buffer = fs.readFileSync(filePath)
      const { ext, mime } = await fileTypeFromBuffer(buffer) // Corrected function call
      const form = new FormData()
      form.append('file', buffer, {
        filename: `${Date.now()}.${ext}`,
        contentType: mime
      })
      const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders()
      })
      return res.data.data.url.replace('s.org/', 's.org/dl/')
    } catch (e) {
      console.error('TmpFiles Error:', e.message)
      return null
    }
  }

  async function uploadToUguu(filePath) {
    try {
      const form = new FormData()
      form.append('files[]', fs.createReadStream(filePath))
      const res = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders()
      })
      return res.data.files?.[0]?.url || null
    } catch (e) {
      console.error('Uguu Error:', e.message)
      return null
    }
  }

  async function uploadToFreeImageHost(buffer) {
    try {
      const form = new FormData()
      form.append('source', buffer, 'file')
      const res = await axios.post('https://freeimage.host/api/1/upload', form, {
        params: { key: '6d207e02198a847aa98d0a2a901485a5' },
        headers: form.getHeaders()
      })
      return res.data.image.url
    } catch (e) {
      console.error('FreeImageHost Error:', e.message)
      return null
    }
  }

  const [supaLink, tmpLink, uguuLink, freeImageHostLink] = await Promise.all([
    uploadToSupa(buffer),
    uploadToTmpFiles(filePath),
    uploadToUguu(filePath),
    uploadToFreeImageHost(buffer),
  ])

  let msg = `✅ *Successfully uploaded to several services:*\n`
  if (supaLink) msg += `\n🔗 *Supa:* ${supaLink}`
  if (tmpLink) msg += `\n🔗 *TmpFiles:* ${tmpLink}`
  if (uguuLink) msg += `\n🔗 *Uguu:* ${uguuLink}`
  if (freeImageHostLink) msg += `\n🔗 *FreeImage.Host:* ${freeImageHostLink}`

  await conn.sendMessage(m.chat, { text: msg }, { quoted: m })
  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  fs.unlinkSync(filePath)
  global.db.data.users[m.sender].limit -= 10
}

handler.help = ['tourl-all']
handler.tags = ['uploader']
handler.command = ['tourl-all']
handler.limit = true

export default handler
