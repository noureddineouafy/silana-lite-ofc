// instagram.com/noureddine_ouafy
import axios from "axios"
import crypto from "crypto"

class GPT1Image {
  constructor() {
    this.baseURL = "https://gpt1image.exomlapi.com"
  }

  randomCryptoIP() {
    const bytes = crypto.randomBytes(4)
    return Array.from(bytes).map(b => b % 256).join(".")
  }

  randomID(length = 16) {
    return crypto.randomBytes(length).toString("hex")
  }

  buildHeaders(extra = {}) {
    const ip = this.randomCryptoIP()
    return {
      "Content-Type": "application/json",
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9",
      origin: this.baseURL,
      referer: `${this.baseURL}/`,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "sec-ch-ua": `"Chromium";v="136", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="136", "Lemur";v="136"`,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-forwarded-for": ip,
      "x-real-ip": ip,
      "x-request-id": this.randomID(8),
      ...extra
    }
  }

  async generate({ prompt, size = "1024x1024", n = 1, enhance = true, format = "url" }) {
    if (!prompt) throw new Error("يرجى كتابة وصف للصورة.")

    const body = {
      prompt,
      n,
      size,
      is_enhance: enhance,
      response_format: format
    }

    const res = await axios.post(`${this.baseURL}/v1/images/generations`, body, {
      headers: this.buildHeaders()
    })

    if (!res.data.data || res.data.data.length === 0) {
      throw new Error("لم يتم العثور على نتيجة.")
    }

    return res.data.data
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) throw '❗ أرسل وصف الصورة مثل: .gptimg قطة تلعب في الحديقة'

  const generator = new GPT1Image()
  try {
    const result = await generator.generate({ prompt: text })
    await conn.sendFile(m.chat, result[0].url, 'image.jpg', `✅ تم توليد الصورة بناءً على الوصف: ${text}`, m)
  } catch (e) {
    await m.reply(`❌ فشل توليد الصورة:\n${e.message}`)
  }
}

handler.help = ['gptimg']
handler.tags = ['ai']
handler.command = ['gptimg']
handler.limit = true
export default handler
