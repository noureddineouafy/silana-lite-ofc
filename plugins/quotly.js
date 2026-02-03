// scrape by malik
// plugin by noureddine ouafy 

import axios from "axios"
import { randomBytes, randomInt } from "crypto"

class Quotly {
  constructor() {
    this.urls = [
      "https://quotly.netorare.codes/generate",
      "https://btzqc.betabotz.eu.org/generate",
      "https://qc.botcahx.eu.org/generate"
    ]
  }

  async generate({
    name,
    text,
    avatar,
    media,
    replyName,
    replyText,
    ...rest
  } = {}) {

    const payload = {
      type: "quote",
      format: "png",
      backgroundColor: "#FFFFFF",
      width: 512,
      height: 768,
      scale: 2,
      ...rest,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: randomInt(1, 1e5),
          name: name || `user-${randomBytes(4).toString("hex")}`,
          photo: {
            url: avatar || "https://telegra.ph/file/1e22e45892774893eb1b9.jpg"
          }
        },
        text: text || `text-${randomBytes(12).toString("hex")}`,
        replyMessage: replyName ? {
          name: replyName,
          text: replyText || `text-${randomBytes(10).toString("hex")}`,
          chatId: randomInt(1e6, 9999999)
        } : undefined,
        media: media ? { url: media } : undefined
      }]
    }

    for (const url of this.urls) {
      try {
        const response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" }
        })

        const data = response.data

        if (data.ok && data.result?.image) {
          return Buffer.from(data.result.image, "base64")
        }
      } catch (e) {
        continue
      }
    }

    throw new Error("Quotly generation failed: All APIs unreachable.")
  }
}

let handler = async (m, { conn, args }) => {

  if (!args[0] && !m.quoted) {
    return conn.reply(m.chat, `
🖼️ *Quotly - WhatsApp Fake Quote Generator*

Usage:
1. Reply to a message and type:
   .quotly

2. Or create custom quote:
   .quotly Your text here

Example:
.quotly Hello world
`, m)
  }

  try {
    const api = new Quotly()

    let text
    let name = m.pushName || "User"

    if (m.quoted) {
      text = m.quoted.text || m.quoted.caption || ""
      name = m.quoted.pushName || "User"
    } else {
      text = args.join(" ")
    }

    if (!text) return conn.reply(m.chat, "❌ No text found.", m)

    const buffer = await api.generate({
      name,
      text
    })

    await conn.sendFile(m.chat, buffer, "quote.png", "✨ Here is your quote image", m)

  } catch (error) {
    console.error(error)
    conn.reply(m.chat, "⚠️ Failed to generate quote image.", m)
  }
}

handler.help = ['quotly']
handler.command = ['quotly']
handler.tags = ['tools']
handler.limit = true

export default handler
