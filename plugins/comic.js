// plugin by : @noureddine_ouafy
// scrape by Tuffz
import axios from 'axios'
import FormData from 'form-data'
import uploadImage from '../lib/uploadImage.js'

async function imageToComic(imageUrl) {
  try {
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageRes.data)

    const form = new FormData()
    form.append('hidden_image_width', '1712')
    form.append('hidden_image_height', '2560')
    form.append('upload_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    })
    form.append('brightness', '50')
    form.append('line_size', '2')
    form.append('screentone', 'true')

    const id = Math.random().toString(36).substring(2, 15)
    const uploadUrl = `https://tech-lagoon.com/canvas/image-to-comic?id=${id}&new_file=true`

    const uploadRes = await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders(),
        origin: 'https://tech-lagoon.com',
        referer: 'https://tech-lagoon.com/imagechef/en/image-to-comic.html',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    })

    if (!Array.isArray(uploadRes.data)) throw new Error('Failed to get result')

    const [resId] = uploadRes.data
    const random = Math.floor(Math.random() * 9000 + 1000)
    return `https://tech-lagoon.com/imagechef/image-to-comic/${resId}?n=${random}`
  } catch (err) {
    console.error('Error:', err.message)
    throw err
  }
}

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!mime.startsWith('image/')) {
    return conn.reply(m.chat, 'Please reply to an image with the command .comic', m)
  }

  try {
    await conn.reply(m.chat, 'Please wait while we convert the image...', m)
    let media = await q.download()
    let imageUrl = await uploadImage(media)
    let comicUrl = await imageToComic(imageUrl)

    await conn.sendFile(m.chat, comicUrl, 'comic.jpg', '✅ Image successfully converted to comic!', m)
  } catch (error) {
    console.error(error)
    conn.reply(m.chat, '❌ An error occurred while processing the image.', m)
  }
}

handler.help = handler.command = ['comic']
handler.tags = ['tools']
handler.limit = true

export default handler
