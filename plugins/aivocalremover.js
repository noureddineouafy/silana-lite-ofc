/**
 * by Tuffz 
 * modified by @instagram: noureddine_ouafy
 * Audio Vocal Remover using AI Vocal Remover API
 */

import axios from 'axios'
import uploadImage from '../lib/uploadImage.js'

async function uploadAudio(mp3Url) {
  try {
    const audioRes = await axios.get(mp3Url, { responseType: 'arraybuffer' })
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2)
    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="fileName"; filename="audio.mp3"\r\n`),
      Buffer.from(`Content-Type: audio/mpeg\r\n\r\n`),
      Buffer.from(audioRes.data),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ])
    const res = await axios.post('https://aivocalremover.com/api/v2/FileUpload', multipartBody, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    const { data } = res
    if (data?.error) throw new Error(data.message)
    return {
      key: data.key,
      file_name: data.file_name
    }
  } catch (err) {
    throw new Error('Upload failed: ' + err.message)
  }
}

async function processAudio(file_name, key) {
  const params = new URLSearchParams({
    file_name,
    action: 'watermark_video',
    key,
    web: 'web'
  })
  try {
    const res = await axios.post('https://aivocalremover.com/api/v2/ProcessFile', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    const { data } = res
    if (data?.error) throw new Error(data.message)
    return {
      vocal: data.vocal_path,
      instrumental: data.instrumental_path
    }
  } catch (err) {
    throw new Error('Processing failed: ' + err.message)
  }
}

let handler = async (m, { conn }) => {
  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    
    if (!mime.includes('audio')) {
      return m.reply('Please send or reply to an audio file you want to separate into vocal and instrumental.')
    }

    m.reply('Processing the audio... Please wait a moment.')
    const media = await q.download()
    const audioUrl = await uploadImage(media)
    const { key, file_name } = await uploadAudio(audioUrl)
    const { vocal, instrumental } = await processAudio(file_name, key)

    await conn.sendMessage(m.chat, {
      audio: { url: vocal },
      mimetype: 'audio/mpeg',
      fileName: 'vocal.mp3'
    }, { quoted: m })

    await conn.sendMessage(m.chat, {
      audio: { url: instrumental },
      mimetype: 'audio/mpeg',
      fileName: 'instrumental.mp3'
    }, { quoted: m })

    m.reply('✅ Successfully separated the vocal and instrumental!')
  } catch (err) {
    console.error(err)
    m.reply('❌ An error occurred: ' + err.message)
  }
}

handler.help = ['aivocalremover']
handler.tags = ['ai']
handler.command = /^(aivocalremover)$/i
handler.limit = true
handler.premium = false

export default handler
