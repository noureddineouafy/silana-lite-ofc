// plugin from liora sc
// modified by instagram.com/noureddine_ouafy


import fetch from "node-fetch"
import crypto from "crypto"
import sharp from "sharp"
import { FormData, Blob } from "formdata-node"
import { fileTypeFromBuffer } from "file-type"

/* ================= CATBOX UPLOADER ================= */

async function uploadToCatbox(buffer) {
  const type = await fileTypeFromBuffer(buffer)
  if (!type) throw new Error("Unsupported image type")

  const blob = new Blob([buffer], { type: type.mime })
  const form = new FormData()
  const name = crypto.randomBytes(5).toString("hex") + "." + type.ext

  form.append("reqtype", "fileupload")
  form.append("fileToUpload", blob, name)

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  })

  const url = await res.text()
  if (!url.startsWith("https://")) {
    throw new Error("Catbox upload failed")
  }

  return url.trim()
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    // 📘 GUIDE
    if (!args[0]) {
      return m.reply(
        `
🎨 *Meme Sticker Generator*

Reply to an image and add text.

📌 Usage:
${usedPrefix + command} text
${usedPrefix + command} top | bottom

🧪 Examples:
${usedPrefix + command} Hello
${usedPrefix + command} When bot works | Perfectly 😎
        `.trim()
      )
    }

    // 📷 CHECK IMAGE
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ""

    if (!/image\/(jpeg|png)/.test(mime)) {
      return m.reply("❌ Please reply to a JPG or PNG image.")
    }

    // ⏬ DOWNLOAD IMAGE
    const imgBuffer = await q.download()
    if (!imgBuffer) return m.reply("❌ Failed to download image.")

    // ⬆ UPLOAD IMAGE
    const imageUrl = await uploadToCatbox(imgBuffer)

    // ✂️ TEXT LOGIC
    const input = args.join(" ").trim()
    let top = input
    let bottom = input

    if (input.includes("|")) {
      const parts = input.split("|")
      top = parts[0]?.trim() || input
      bottom = parts[1]?.trim() || parts[0]?.trim() || input
    }

    // ✅ PROXY IMAGE (CRITICAL FIX)
    const proxiedBg = `https://images.weserv.nl/?url=${encodeURIComponent(
      imageUrl.replace(/^https?:\/\//, "")
    )}&output=png`

    const memeUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(
      top
    )}/${encodeURIComponent(
      bottom
    )}.png?background=${encodeURIComponent(proxiedBg)}`

    // 🎯 FETCH MEME
    const pngBuffer = Buffer.from(
      await (await fetch(memeUrl)).arrayBuffer()
    )

    // 🔁 PNG → WEBP
    const webpBuffer = await sharp(pngBuffer)
      .resize(512, 512, { fit: "inside" })
      .webp({ quality: 85 })
      .toBuffer()

    // 🏷 SEND STICKER
    await conn.sendMessage(
      m.chat,
      { sticker: webpBuffer },
      { quoted: m }
    )

  } catch (err) {
    console.error(err)
    m.reply("❌ Error: " + err.message)
  }
}

handler.help = ["smeme"]
handler.tags = ["tools"]
handler.command = /^smeme$/i
handler.limit = true

export default handler
