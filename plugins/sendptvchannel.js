const handler = async (m, { conn }) => {
  const channel = "120363377359042191@newsletter"

  // تأكد أن الرسالة تحتوي على فيديو
  let msg = m.quoted ? m.quoted : m
  let mime = (msg.msg || msg).mimetype || ""

  if (!mime.startsWith("video"))
    return m.reply("⚠️ Please send or reply to a video")

  // تحميل الفيديو
  let media = await msg.download()

  // إرسال كـ PTV
  await conn.sendMessage(channel, {
    video: media,
    mimetype: "video/mp4",
    ptv: true
  })

  m.reply("✅ Video sent as PTV successfully")
}

handler.command = ["sendptvchannel"]
handler.owner = true

export default handler
