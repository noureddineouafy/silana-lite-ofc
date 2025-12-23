// plugin by instagram.com/noureddine_ouafy
// scrape by malik🥰

import axios from "axios"
import FormData from "form-data"

/* ================= IMAGE COLORIZER CLASS ================= */

class ImageColorizer {
  constructor() {
    this.cfg = {
      upUrl: "https://photoai.imglarger.com/api/PhoAi/Upload",
      ckUrl: "https://photoai.imglarger.com/api/PhoAi/CheckStatus",
      hdrs: {
        accept: "application/json, text/plain, */*",
        origin: "https://imagecolorizer.com",
        referer: "https://imagecolorizer.com/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/127 Mobile Safari/537.36"
      }
    }
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  base64(str) {
    return Buffer.from(str || "").toString("base64")
  }

  async getBuffer(input) {
    if (Buffer.isBuffer(input)) return input
    if (typeof input === "string" && input.startsWith("http")) {
      const res = await axios.get(input, { responseType: "arraybuffer" })
      return Buffer.from(res.data)
    }
    throw new Error("Invalid image input")
  }

  async upload(buffer, params) {
    const form = new FormData()
    form.append("file", buffer, {
      filename: "image.jpg",
      contentType: "image/jpeg"
    })
    form.append("type", 17)
    form.append("restore_face", "false")
    form.append("upscale", "false")
    form.append("positive_prompts", params.pos)
    form.append("negative_prompts", params.neg)
    form.append("scratches", "false")
    form.append("portrait", "false")
    form.append("color_mode", "2")

    const res = await axios.post(this.cfg.upUrl, form, {
      headers: { ...this.cfg.hdrs, ...form.getHeaders() }
    })

    return res?.data?.data
  }

  async check(code, type) {
    const res = await axios.post(
      this.cfg.ckUrl,
      { code, type },
      {
        headers: {
          ...this.cfg.hdrs,
          "content-type": "application/json"
        }
      }
    )
    return res?.data
  }

  async generate(imageBuffer, prompt) {
    const posPrompt =
      (prompt || "") +
      ", masterpiece, high quality, sharp, 8k photography"
    const negPrompt =
      "black and white, blur, grain, sepia, low quality"

    const task = await this.upload(imageBuffer, {
      pos: this.base64(posPrompt),
      neg: this.base64(negPrompt)
    })

    if (!task?.code) throw new Error("Failed to get task code")

    for (let i = 0; i < 60; i++) {
      await this.sleep(3000)
      const status = await this.check(task.code, task.type || 17)
      if (status?.data?.status === "success") {
        return status.data.downloadUrls[0]
      }
    }

    throw new Error("Processing timeout")
  }
}

/* ================= USER GUIDE ================= */

const GUIDE = `
🎨 *AI Image Colorizer*

This feature uses AI to restore and colorize black & white photos.

━━━━━━━━━━━━━━━━━━
🧑‍💻 HOW TO USE
━━━━━━━━━━━━━━━━━━
1️⃣ Reply to a black & white image
2️⃣ Send the command:
.colorize

Optional:
.colorize <custom prompt>

━━━━━━━━━━━━━━━━━━
📂 SUPPORTED INPUT
━━━━━━━━━━━━━━━━━━
• JPG / JPEG
• PNG
• Black & white photos
• Old photos

━━━━━━━━━━━━━━━━━━
📝 EXAMPLES
━━━━━━━━━━━━━━━━━━
.colorize
.colorize realistic colors
.colorize vintage style

━━━━━━━━━━━━━━━━━━
⚠️ NOTES
━━━━━━━━━━━━━━━━━━
• One image per command
• Processing takes 10–30 seconds
• Works best on clear faces
• Daily usage limits may apply
`

/* ================= HANDLER ================= */

let handler = async (m, { conn, args }) => {
  try {
    if (!m.quoted && !m.msg?.mimetype) {
      return m.reply(GUIDE)
    }

    const media = m.quoted || m
    const mime = media.mimetype || ""
    if (!mime.startsWith("image/")) {
      return m.reply("❌ Please reply to an image file.")
    }

    const buffer = await media.download()
    if (!buffer) throw new Error("Failed to download image")

    const userPrompt = args.join(" ")

    m.reply("🎨 Colorizing image, please wait...")

    const api = new ImageColorizer()
    const resultUrl = await api.generate(buffer, userPrompt)

    await conn.sendFile(
      m.chat,
      resultUrl,
      "colorized.jpg",
      "✅ Image colorization completed",
      m
    )
  } catch (e) {
    m.reply("❌ Failed to colorize image:\n" + e.message)
  }
}

handler.help = handler.command = ["colorize"]
handler.tags = ["ai"]
handler.limit = true

export default handler
