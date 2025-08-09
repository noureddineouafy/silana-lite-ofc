import axios from 'axios'
import FormData from 'form-data'

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    
    if (!mime.startsWith('image/')) return m.reply('Where is the image?')

    m.reply('Please wait...')

    const img = await q.download()
    const form = new FormData()
    form.append('image', img, 'image.jpg')
    form.append('scale', '2')

    const { data } = await axios.post('https://api2.pixelcut.app/image/upscale/v1', form, {
      headers: {
        ...form.getHeaders(),
        'accept': 'application/json',
        'x-client-version': 'web'
      }
    })

    await conn.sendMessage(m.chat, { 
      image: { url: data.result_url }, 
    }, { quoted: m })

  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['hd2']
handler.command = ['hd2']
handler.tags = ['tools']
handler.limit = true
export default handler
