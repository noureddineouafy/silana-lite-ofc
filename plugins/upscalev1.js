// instagram.com/noureddine_ouafy

import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'

let handler = async (m, { conn, args }) => {
  if (!m.quoted || !m.quoted.fileSha256) 
    return m.reply("⛔ من فضلك قم بالرد على صورة لاستعمال هذه الميزة")

  m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy")

  try {
    let media = await m.quoted.download()
    if (!media) throw "⚠️ لم أتمكن من تحميل الصورة."

    let result = await upscaleImage(media)
    if (!result?.result_url) throw "❌ فشل في رفع الصورة."

    await conn.sendFile(m.chat, result.result_url, 'upscaled.jpg', '✅ هذه هي الصورة بعد تحسين الجودة 🔼', m)
  } catch (e) {
    m.reply("❌ حدث خطأ أثناء المعالجة:\n" + e)
  }
}

handler.help = ['upscalev1']
handler.tags = ['tools']
handler.command = /^upscalev1$/i
handler.limit = true

export default handler

// ================================
// وظيفة خارجية لرفع جودة الصورة
async function upscaleImage(imageBuffer) {
  if (!imageBuffer?.length) throw Error("⚠️ الملف غير موجود")

  const body = new FormData()
  body.append("image", new Blob([imageBuffer]))
  body.append("scale", "2")

  const headers = {
    "accept": "application/json",
    "x-client-version": "web",
    ...body.headers
  }

  const res = await fetch("https://api2.pixelcut.app/image/upscale/v1", {
    method: "POST",
    headers,
    body
  })

  if (!res.ok) throw Error(`${res.status} ${res.statusText}\n${await res.text()}`)
  return await res.json()
}
