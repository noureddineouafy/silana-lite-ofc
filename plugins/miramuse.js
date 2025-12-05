// instagram.com/noureddine_ouafy
// scrape by malik

import axios from "axios"
import crypto from "crypto"

class MiraMuseAI {
  constructor() {
    this.baseUrl = "https://mjaiserver.erweima.ai"
    this.origin = "https://miramuseai.net"
    this.uniqueId = crypto.randomBytes(16).toString("hex")
    this.validModels = ["flux", "tamarin", "superAnime", "visiCanvas", "realistic", "oldRealistic", "anime", "3danime"]
    this.validSizes = ["1:2", "9:16", "3:4", "1:1", "4:3", "16:9", "2:1"]

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US",
        "content-type": "application/json",
        origin: this.origin,
        referer: `${this.origin}/`,
        uniqueid: this.uniqueId,
        "user-agent": "Mozilla/5.0 (Mobile Safari)"
      }
    })

    console.log(`[Init MiraMuseAI] UniqueID: ${this.uniqueId}`)
  }

  validate(value, list, defaultValue) {
    return list.includes(value) ? value : defaultValue
  }

  async generate({ prompt, imageUrl, ...rest }) {
    const validatedPrompt = prompt || ""
    const validatedModel = this.validate(rest.model, this.validModels, "realistic")
    const validatedSize = this.validate(rest.size, this.validSizes, "3:4")

    const payload = {
      prompt: validatedPrompt,
      negativePrompt: rest.negativePrompt || "",
      model: validatedModel,
      size: validatedSize,
      batchSize: rest.batchSize || "1",
      imageUrl: imageUrl || "",
      rangeValue: rest.rangeValue || null
    }

    const { data } = await this.axios.post("/api/v1/generate/generateMj", payload)
    const recordId = data?.data?.replace("-", "")
    if (!recordId) throw new Error("No recordId received")

    return await this.poll(recordId)
  }

  async poll(recordId, maxAttempts = 60, interval = 3000) {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await this.axios.get("/api/midjourneyaiGenerateRecord/getRecordDetails", {
        params: { recordId }
      })

      const state = data?.data?.picState || "unknown"

      if (state === "success") {
        const picUrl = data?.data?.picUrl ? JSON.parse(data.data.picUrl) : []

        return {
          result: picUrl,
          id: data?.data?.id,
          prompt: data?.data?.picPrompt,
          executedPrompt: data?.data?.picPromptExecuted,
          generateTime: data?.data?.generateTime,
          completeTime: data?.data?.generateCompleteTime,
          type: data?.data?.type,
          batchSize: data?.data?.batchSize,
          nsfwFlag: data?.data?.nsfwFlag,
          state
        }
      }

      if (state === "failed" || state === "error") {
        throw new Error(`Image generation failed: ${data?.data?.failCode || "Unknown error"}`)
      }

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    throw new Error("Polling timeout")
  }
}


/* ============================================================
   📌 WHATSAPP BOT MESSAGE HANDLER (ENGLISH)
   ============================================================ */

let handler = async (m, { conn, text }) => {

  if (!text) {
    return m.reply(`
🖼️ *MiraMuse AI Image Generator*

Create high-quality AI images using different models and sizes.

🔧 *How to Use:*
→ .miramuse prompt | model(optional) | size(optional)

📌 *Example:*
.miramuse beautiful cyberpunk girl | anime | 3:4

📌 *Available Models:*
flux, tamarin, superAnime, visiCanvas, realistic, oldRealistic, anime, 3danime

📌 *Available Sizes:*
1:2, 9:16, 3:4, 1:1, 4:3, 16:9, 2:1
`)
  }

  // Split user text
  let [prompt, model, size] = text.split("|").map(v => v?.trim())

  const api = new MiraMuseAI()

  try {
    m.reply("⏳ *Generating your image, please wait...*")

    const result = await api.generate({
      prompt,
      model,
      size
    })

    for (let url of result.result) {
      await conn.sendFile(m.chat, url, "ai.jpg", `✨ *MiraMuse AI Result*`, m)
    }

  } catch (err) {
    m.reply("❌ Error:\n" + err.message)
  }
}

handler.help = handler.command = ["miramuse"]
handler.tags = ["ai"]
handler.limit = true

export default handler
