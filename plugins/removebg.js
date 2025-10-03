// Instagram: noureddine_ouafy
// scrape by malik
import axios from "axios"
import FormData from "form-data"

class RemoveBg {
  constructor() {
    this.API_URL = "https://backrem.pi7.org/remove_bg"
    this.HEADERS = {
      Connection: "keep-alive",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      Accept: "*/*",
      Origin: "https://image.pi7.org",
      Referer: "https://image.pi7.org/"
    }
  }

  _randName() {
    return `id_${Date.now()}${(Math.random() + 1).toString(36).substring(7)}`
  }

  async run({ buffer, contentType }) {
    try {
      const fileSizeMB = buffer.length / (1024 * 1024)
      if (fileSizeMB > 5) throw new Error(`❌ File size ${fileSizeMB.toFixed(2)}MB exceeds 5MB limit.`)

      const extension = contentType.split("/")[1] || "jpg"
      const form = new FormData()
      const fileName = `${this._randName()}.${extension}`

      form.append("myFile[]", buffer, {
        filename: fileName,
        contentType: contentType
      })

      const result = await axios.post(this.API_URL, form, {
        headers: {
          ...form.getHeaders(),
          ...this.HEADERS
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })

      if (result.data?.images?.length > 0) {
        return `https://backrem.pi7.org/${result.data.images[0].filename}`
      } else {
        throw new Error("❌ Failed to process image, invalid API response.")
      }
    } catch (error) {
      throw error
    }
  }
}

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""
  if (!/image\/(jpe?g|png)/.test(mime)) throw "📷 Please reply with an image and use *.removebg*"

  try {
    let img = await q.download() // download image buffer
    const remover = new RemoveBg()
    let result = await remover.run({ buffer: img, contentType: mime })

    await conn.sendFile(m.chat, result, "removed.png", "✅ Background removed successfully!", m)
  } catch (e) {
    throw "❌ Error removing background, please try again."
  }
}

handler.help = ["removebg"]
handler.command = ["removebg"]
handler.tags = ["tools"]
handler.limit = true

export default handler
