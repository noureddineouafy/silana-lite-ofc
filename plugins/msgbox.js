// plugin by instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios"
import FormData from "form-data"

class KobaltGen {
  constructor() {
    this.url = "https://msgboxgen.kobalt.dev/submit/"
    this.defaultHeaders = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      Referer: "https://msgboxgen.kobalt.dev/",
      Origin: "https://msgboxgen.kobalt.dev",
      Priority: "u=0, i"
    }
  }

  log(msg) {
    console.log(`[Kobalt] ${new Date().toLocaleTimeString()} > ${msg}`)
  }

  async generate({ message, ...rest }) {
    this.log("Initializing form construction...")
    try {
      const form = new FormData()
      const msg = message || "Save changes to 'untitled'?"
      const title = rest?.title || "Message"
      const btns = rest?.buttons || "Yes;No;Cancel"

      form.append("title", title)
      form.append("message", msg)
      form.append("buttons", btns)
      form.append("icon", rest?.icon || "")
      form.append("font", rest?.font || "tahoma")
      form.append("width", rest?.width ? String(rest.width) : "300")
      form.append("windowBackgroundColor", rest?.winColor || "#c0c0c0")
      form.append("titleBarStartColor", rest?.barStart || "#000080")
      form.append("titleBarEndColor", rest?.barEnd || "#1084d0")
      form.append("titleBarTextColor", rest?.barText || "#ffffff")
      form.append("buttonTextColor", rest?.btnText || "#000000")
      form.append("buttonBackgroundColor", rest?.btnBg || "#c0c0c0")
      form.append("submit", "Generate")

      this.log(`Payload set: "${title}" -> "${msg}"`)

      const headers = { ...this.defaultHeaders, ...form.getHeaders() }
      this.log("Sending request...")

      const response = await axios.post(this.url, form, {
        headers,
        responseType: "arraybuffer"
      })

      const buffer = response?.data
      return buffer instanceof Buffer ? buffer : Buffer.from([])
    } catch (err) {
      const status = err?.response?.status ? `[${err.response.status}]` : ""
      this.log(`Error ${status}: ${err?.message || "Unknown Error"}`)
      return Buffer.from([])
    }
  }
}

// =========================
// WhatsApp Command Handler
// =========================

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat, 
      `❗ *Please provide a message to generate a Windows MessageBox image.*\n\n` +
      `Example:\n` +
      `> .msgbox Hello, this is a test popup`, 
      m
    )
  }

  let message = args.join(" ")

  const api = new KobaltGen()
  
  try {
    const result = await api.generate({ message })

    if (!result || result.length === 0) {
      return conn.reply(m.chat, "❗ Failed to generate the image.", m)
    }

    await conn.sendMessage(
      m.chat,
      { image: result, caption: "Here is your generated Windows MessageBox." },
      { quoted: m }
    )
  } catch (e) {
    await conn.reply(m.chat, `❗ Error: ${e.message}`, m)
  }
}

handler.help = ['msgbox']
handler.tags = ['tools']
handler.command = ['msgbox', 'winmsg']
handler.limit = true

export default handler
