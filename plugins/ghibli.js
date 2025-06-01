// instagram.com/noureddine_ouafy
// feature by rikikangsc2-eng
import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let imageUrl = args[0]

  if (!imageUrl) {
    return m.reply(`❌ يجب عليك إرسال رابط صورة.\n\nمثال:\n${usedPrefix + command} https://example.com/image.jpg`)
  }

  try {
    const apiUrl = `https://nirkyy-api.hf.space/api/togihibli?url=${encodeURIComponent(imageUrl)}`
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer'
    })

    await conn.sendMessage(m.chat, {
      image: Buffer.from(response.data),
      caption: '🌸 تم تحويل الصورة بأسلوب Ghibli!',
    }, { quoted: m })

  } catch (e) {
    console.error('Error:', e)
    m.reply('❌ حدث خطأ أثناء معالجة الصورة: ' + e.message)
  }
}

handler.help = handler.command = ['ghibli']
handler.tags = ['ai']
handler.limit = true
export default handler
