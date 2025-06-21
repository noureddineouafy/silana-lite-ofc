// instagram.com/noureddine_ouafy
// scrape By Fgsi 
import { randomInt } from "crypto"
import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"

class AIArtClient {
  constructor() {
    this.baseURL = "https://aiart-zroo.onrender.com"
    this.ip = this._generateRandomIP()
  }

  _generateRandomIP() {
    return Array(4).fill().map(() => randomInt(0, 256)).join(".")
  }

  _buildHeaders(refererPath = "/image-to-video") {
    const headers = {
      authority: "aiart-zroo.onrender.com",
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      origin: this.baseURL,
      referer: `${this.baseURL}${refererPath}`,
      "user-agent": "Mozilla/5.0 (Linux; Android 10)",
    }
    for (const h of [
      "X-Forwarded-For", "X-Originating-IP", "X-Remote-IP", 
      "X-Remote-Addr", "X-Host", "X-Forwarded-Host", "X-Connecting-IP"
    ]) headers[h] = this.ip
    return headers
  }

  async enhancePrompt(prompt) {
    const form = new FormData()
    form.append("prompt", prompt)
    const res = await axios.post(`${this.baseURL}/api/enhance-prompt-ui`, form, {
      headers: {
        ...this._buildHeaders("/text-to-image"),
        ...form.getHeaders(),
      },
    })
    return res.data
  }

  async textToImage(prompt) {
    const form = new FormData()
    form.append("video_description", prompt)
    form.append("test_mode", "false")
    form.append("negative_prompt", "")
    form.append("style_preset", "")
    form.append("aspect_ratio", "16:9")
    form.append("output_format", "png")
    form.append("seed", "0")
    form.append("website", "")
    const res = await axios.post(`${this.baseURL}/generate-txt2img-ui`, form, {
      headers: {
        ...this._buildHeaders("/text-to-image"),
        ...form.getHeaders(),
      },
    })
    return res.data.success ? { image: `${this.baseURL}${res.data.image_path}` } : { error: res.data.message }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('❌ أرسل وصف الصورة التي تريد إنشائها مثل: .test قط يضحك تحت المطر')
  m.reply("🖌️ يتم إنشاء الصورة، المرجو الانتظار قليلاً...")

  try {
    const client = new AIArtClient()
    const enhanced = await client.enhancePrompt(text)
    const imageData = await client.textToImage(enhanced.enhanced_prompt)
    if (imageData.error) return m.reply(`❌ فشل الإنشاء: ${imageData.error}`)
    await conn.sendFile(m.chat, imageData.image, 'image.png', `✅ تم إنشاء الصورة بنجاح لـ: ${text}`, m)
  } catch (err) {
    console.error(err)
    m.reply("❌ حدث خطأ أثناء إنشاء الصورة.")
  }
}

handler.help = handler.command = ['aiart-zroo']
handler.tags = ['ai']
handler.limit = true
export default handler
