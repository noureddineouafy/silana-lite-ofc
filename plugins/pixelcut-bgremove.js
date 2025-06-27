// @noureddine_ouafy
// scrape by wolfyflutter
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Buffer } from 'buffer'

let handler = async (m, { conn }) => {
  let q = m.quoted || m
  let mime = q?.mimetype || m?.msg?.mimetype || ''
  let image

  // محاولة تحميل الصورة من الرد أو من الرسالة نفسها
  try {
    if (mime.startsWith('image/')) {
      image = await q.download?.()
    } else if (m.message?.imageMessage) {
      image = await conn.downloadMediaMessage(m)
    }
  } catch (e) {
    console.error("📛 تحميل الصورة فشل:", e)
  }

  if (!image) return m.reply('🖼️ من فضلك قم *بالرد على صورة حقيقية* أو *أرسل صورة مباشرة*')

  try {
    await m.reply('⏳ يتم الآن إزالة الخلفية...')

    const buffer = await removeBackground(image)
    if (!buffer) return m.reply('❌ لم يتم الحصول على نتيجة')

    await conn.sendFile(m.chat, buffer, 'no-bg.png', '✅ تم إزالة الخلفية بنجاح!', m)
  } catch (err) {
    console.error(err)
    m.reply(`❌ حدث خطأ أثناء إزالة الخلفية:\n${err.message}`)
  }
}

handler.help = ['pixelcut-bgremove']
handler.tags = ['tools']
handler.command = ['pixelcut-bgremove']
handler.limit = true
export default handler

// ===== remove background function =====
async function removeBackground(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer)) throw Error(`📛 الملف غير صالح (ليس من نوع buffer)`)

  const body = new FormData()
  body.append("format", "png")
  body.append("model", "v1")
  body.append("image", imageBuffer, { filename: 'image.png' })

  const headers = {
    "x-client-version": "web",
    ...body.getHeaders()
  }

  const response = await fetch("https://api2.pixelcut.app/image/matte/v1", {
    method: "POST",
    headers,
    body
  })

  if (!response.ok) {
    const text = await response.text()
    throw Error(`${response.status} ${response.statusText}\n${text}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
