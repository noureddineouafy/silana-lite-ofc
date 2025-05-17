// instagram.com/noureddine_ouafy
//scrape by malik
import axios from "axios"

class SunoAPI {
  constructor() {
    this.baseURL = "https://suno.exomlapi.com"
    this.headers = {
      accept: "*/*",
      "content-type": "application/json",
      origin: "https://suno.exomlapi.com",
      referer: "https://suno.exomlapi.com/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    }
    this.interval = 3000
    this.timeout = 300000
  }

  async generate({ prompt }) {
    let taskId, token
    try {
      const generateResponse = await axios.post(`${this.baseURL}/generate`, {
        prompt: prompt
      }, {
        headers: this.headers
      })
      ;({ taskId, token } = generateResponse.data)

      const startTime = Date.now()
      while (Date.now() - startTime < this.timeout) {
        await new Promise(resolve => setTimeout(resolve, this.interval))
        const statusResponse = await axios.post(`${this.baseURL}/check-status`, {
          taskId,
          token
        }, {
          headers: this.headers
        })

        if (statusResponse.data.results?.every(res => res.audio_url && res.image_url && res.lyrics)) {
          return statusResponse.data
        }
      }
      return { status: "timeout" }
    } catch (error) {
      return {
        status: "error",
        error: error.message
      }
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("المرجو إدخال وصف (prompt)\nGenerate music Using ai ex : \n *.suno Father*")

  m.reply("المرجو الانتظار ... جاري صنع الاغنية التي طلبتها \n please wait ... 🎶 Ai generat ....")

  const api = new SunoAPI()
  const result = await api.generate({ prompt: text })

  if (result.status === "error") return m.reply(`وقع خطأ: ${result.error}`)
  if (result.status === "timeout") return m.reply("انتهى الوقت دون الحصول على النتائج")

  for (let item of result.results) {
    await conn.sendFile(m.chat, item.audio_url, 'audio.mp3', `Lyrics:\n${item.lyrics}`, m)
    await conn.sendFile(m.chat, item.image_url, 'image.jpg', '', m)
  }
}

handler.help = ['suno']
handler.tags = ['ai']
handler.command = ['suno']
handler.limit = true;
export default handler
