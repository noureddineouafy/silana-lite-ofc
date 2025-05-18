// instagram.com/noureddine_ouafy

import axios from 'axios'
import https from 'https'
import { FormData, Blob } from 'formdata-node'

class UnblurAI {
  constructor() {
    this.apiBase = "https://api.unblurimage.ai/api"
    this.endpoints = {
      UNBLUR: "/imgupscaler/v2/ai-image-unblur/create-job",
      UPSCALE: "/imgupscaler/v2/ai-image-upscale/create-job",
      MILD: "/imgupscaler/v2/ai-image-mild-unblur/create-job",
      STATUS: "/imgupscaler/v2/ai-image-unblur/get-job"
    }
    this.headers = {
      "product-code": "067003",
      "product-serial": `device-${Date.now()}-${Math.random().toString(36).slice(7)}`,
      accept: "*/*",
      "user-agent": "Postify/1.0.0"
    }
  }

  async fetchImageBuffer(imageURL) {
    const { data } = await axios.get(imageURL, {
      responseType: "arraybuffer",
      headers: { accept: "image/*", "user-agent": "Postify/1.0.0" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
      timeout: 15000
    })
    return new Blob([data], { type: "image/png" })
  }

  async processImage({ url, mode = "UNBLUR", scaleFactor = "2" }) {
    const imageBlob = await this.fetchImageBuffer(url)
    const formData = new FormData()
    formData.append("original_image_file", imageBlob, "image.png")
    if (mode === "UPSCALE") {
      formData.append("scale_factor", scaleFactor)
      formData.append("upscale_type", "image-upscale")
    }

    const reqUrl = `${this.apiBase}${this.endpoints[mode]}`
    const response = await axios.post(reqUrl, formData, {
      headers: { ...this.headers, ...formData.headers },
      httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
      timeout: 20000
    })

    const jobId = response?.data?.result?.job_id
    return jobId ? await this.checkJobStatus(jobId) : { status: false }
  }

  async checkJobStatus(jobId) {
    const url = `${this.apiBase}${this.endpoints.STATUS}/${jobId}`
    const start = Date.now()
    while (Date.now() - start < 60000) {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 5000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
      })
      const data = response.data
      if (data?.code === 100000 && data.result?.output_url?.[0]) {
        return { status: true, url: data.result.output_url[0] }
      }
      if (data?.code !== 300006) break
      await new Promise(r => setTimeout(r, 3000))
    }
    return { status: false }
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]?.startsWith('http')) throw 'يرجى إرسال رابط صورة صالح.'

  await m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy")

  const unblurAI = new UnblurAI()
  try {
    const result = await unblurAI.processImage({ url: args[0], mode: "UNBLUR" })
    if (!result.status) throw 'فشل في تحسين الصورة، حاول لاحقاً.'
    await conn.sendFile(m.chat, result.url, 'unblurred.png', '✅ تم تحسين الصورة بنجاح', m)
  } catch (e) {
    console.error(e)
    throw 'حدث خطأ أثناء معالجة الصورة.'
  }
}

handler.help = ['unblur']
handler.tags = ['ai']
handler.command = /^unblur$/i
handler.limit = true;
export default handler
