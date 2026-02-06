// Plugin by noureddine_ouafy
// Converts an image to a pencil sketch using an online API.

import axios from 'axios'
import FormData from 'form-data'
import https from 'https'
import crypto from 'crypto'

// Generate a random session hash
function generateSessionHash() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 11; i++) {
    const byte = crypto.randomBytes(1)[0]
    result += chars[byte % chars.length]
  }
  return result
}

// Read and parse the stream for the final image result
function getStream(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let buffer = ''
      res.on('data', chunk => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''))
              if (data.msg === 'process_completed' && data.output?.data?.[0]?.url) {
                resolve(data.output.data[0].url)
              }
            } catch (e) {}
          }
        }
      })
      res.on('end', () => reject('Stream ended without completion'))
    }).on('error', reject)
  })
}

// Upload the image buffer to Catbox to get a public image URL
async function uploadToCatbox(imageBuffer) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('userhash', '')
  form.append('fileToUpload', imageBuffer, { filename: 'image.jpg' })

  const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders()
  })
  return data
}

// Convert the uploaded image into a sketch using the HuggingFace API
async function imageToSketch(imageUrl) {
  const sessionHash = generateSessionHash()

  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })

  const form = new FormData()
  form.append('files', Buffer.from(imageResponse.data), {
    filename: 'image.jpg',
    contentType: 'image/jpeg',
  })

  const headers = {
    ...form.getHeaders(),
  }

  const uploadRes = await axios.post(
    'https://raec25-image-to-drawing-sketch.hf.space/gradio_api/upload?upload_id=qcu1l42hpn',
    form,
    { headers }
  )

  const filePath = uploadRes.data[0]

  const payload = {
    data: [
      {
        path: filePath,
        url: `https://raec25-image-to-drawing-sketch.hf.space/gradio_api/file=${filePath}`,
        orig_name: 'image.jpg',
        size: imageResponse.data.length,
        mime_type: 'image/jpeg',
        meta: { _type: 'gradio.FileData' }
      },
      "Pencil Sketch"
    ],
    event_data: null,
    fn_index: 2,
    trigger_id: 13,
    session_hash: sessionHash
  }

  await axios.post(
    'https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/join?__theme=system',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )

  const result = await getStream(`https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/data?session_hash=${sessionHash}`)
  return result
}

// WhatsApp bot command handler
let kana = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/image/.test(mime)) {
    await conn.sendMessage(m.chat, {
      react: { text: '❌', key: m.key }
    })
    return conn.sendMessage(m.chat, {
      text: `🖼️ *Please reply to or send an image with the command* *${usedPrefix + command}*!`
    })
  }

  try {
    await conn.sendMessage(m.chat, {
      react: { text: '🎨', key: m.key }
    })

    const buffer = await q.download()
    const imageUrl = await uploadToCatbox(buffer)
    const sketchUrl = await imageToSketch(imageUrl)

    await conn.sendMessage(m.chat, {
      image: { url: sketchUrl },
      caption: `✏️ *Successfully converted the image to a pencil sketch!*\n\nHow do you like the result? 😊`
    })

    await conn.sendMessage(m.chat, {
      react: { text: '✨', key: m.key }
    })

  } catch (e) {
    await conn.sendMessage(m.chat, {
      react: { text: '❌', key: m.key }
    })
    await conn.sendMessage(m.chat, {
      text: `😵 *Oops, an error occurred!*\nThe conversion process failed. The image may be too large or the server is currently busy. Please try again later.`
    })
  }
}

kana.help = ['image2sketch']
kana.tags = ['editor']
kana.command = /^(image2sketch)$/i
kana.limit = true

export default kana
