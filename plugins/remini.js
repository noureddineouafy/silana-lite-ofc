// @noureddine_ouafy

import axios from 'axios'
import FormData from 'form-data'

let handler = async (m, { conn, args }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''
  
  if (!mime.startsWith('image/')) {
    return m.reply('Please reply to an image.')
  }

  m.reply('Please wait while your image is being enhanced...')

  const media = await q.download()

  try {
    let form = new FormData()
    form.append('image', media, {
      filename: 'image.png',
      contentType: 'image/png'
    })
    form.append('user_id', '')
    form.append('is_public', 'false')

    const { data } = await axios.post('https://picupscaler.com/api/generate/handle', form, {
      headers: {
        ...form.getHeaders(),
        Origin: 'https://picupscaler.com',
        Referer: 'https://picupscaler.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      }
    })

    if (!data?.url) return m.reply('Failed to retrieve the enhanced image.')

    await conn.sendMessage(m.chat, { 
      image: { url: data.url }, 
      caption: `✅ Image enhanced successfully!` 
    }, { quoted: m })
    
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

handler.help = ['remini']
handler.command = ['remini']
handler.tags = ['tools']
handler.limit = true
export default handler
