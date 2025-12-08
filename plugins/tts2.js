// plugin by instagram.com/noureddine_ouafy
// scrape by Noureddine ouafy

import WebSocket from "ws"
import axios from "axios"
import crypto from "crypto"

const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "")
const toSnakeCaseKeys = obj => {
  if (Array.isArray(obj)) return obj.map(v => toSnakeCaseKeys(v))
  else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const newKey = toSnakeCase(key)
      result[newKey] = toSnakeCaseKeys(obj[key])
      return result
    }, {})
  }
  return obj
}

class VoicerTool {
  constructor() {
    this.apiToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    this.wssUrl = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1"
    this.voicesUrl = "https://voicertool.com/voices.json"
    this.secMsGecVersion = "1-139.0.3405.86"
    this.voiceCache = null
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === "x" ? r : r & 3 | 8
        return v.toString(16)
      })
      .replace(/-/g, "")
  }

  async generateSecMsGec() {
    const WINDOWS_TICKS = 11644473600
    const TICKS_PER_SECOND = 1e7
    let timestamp = Date.now() / 1e3
    timestamp += WINDOWS_TICKS
    timestamp -= timestamp % 300
    timestamp *= TICKS_PER_SECOND
    const hash = crypto.createHash("sha256")
      .update(Math.floor(timestamp).toString() + this.apiToken, "ascii")
      .digest("hex")
    return hash.toUpperCase()
  }

  async voice_list() {
    if (this.voiceCache) return this.voiceCache
    const response = await axios.get(this.voicesUrl)
    this.voiceCache = response.data
    return this.voiceCache
  }

  async findVoice(voiceInput) {
    // 🔥 Default: Arabic voice
    if (!voiceInput) return "ar-SA-HamedNeural"

    const voices = await this.voice_list()
    const input = voiceInput.toLowerCase()

    for (const data of Object.values(voices)) {
      if (!data.voices) continue
      const found = data.voices.find(v =>
        v.value?.toLowerCase() === input ||
        v.name?.toLowerCase() === input
      )
      if (found) return found.value
    }

    return voiceInput
  }

  createSSML(text, voice, rate = "+0%", pitch = "+0Hz", volume = "+0%", style = "") {
    let content = text

    if (rate !== "+0%" || pitch !== "+0Hz" || volume !== "+0%") {
      content = `<prosody rate="${rate}" pitch="${pitch}" volume="${volume}">${content}</prosody>`
    }
    if (style) {
      content = `<mstts:express-as style="${style}">${content}</mstts:express-as>`
    }

    return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="ar-SA">
  <voice name="${voice}">
    ${content}
  </voice>
</speak>`
  }

  async generate({ text, voice, rate, pitch, volume, style }) {
    const selectedVoice = await this.findVoice(voice)
    const connId = this.generateUUID()
    const secMsGec = await this.generateSecMsGec()

    const wsUrl = `${this.wssUrl}?ConnectionId=${connId}&TrustedClientToken=${this.apiToken}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${this.secMsGecVersion}`

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, { headers: { Origin: "https://voicertool.com" } })
      const audioChunks = []

      ws.on("open", () => {
        const timestamp = new Date().toString()

        ws.send(
          `Content-Type: application/json; charset=utf-8\r\n` +
          `Path: speech.config\r\n` +
          `X-Timestamp: ${timestamp}\r\n\r\n` +
          JSON.stringify({
            context: { synthesis: { audio: { outputFormat: "audio-24khz-96kbitrate-mono-mp3" } } }
          })
        )

        const ssml = this.createSSML(text, selectedVoice, rate, pitch, volume, style)

        ws.send(
          `Content-Type: application/ssml+xml\r\n` +
          `Path: ssml\r\n` +
          `X-RequestId: ${connId}\r\n` +
          `X-Timestamp: ${timestamp}\r\n\r\n` +
          ssml
        )
      })

      ws.on("message", (data, isBinary) => {
        if (isBinary) {
          const headerLength = data.readUInt16BE(0)
          audioChunks.push(data.subarray(headerLength + 2))
        } else if (data.toString().includes("Path:turn.end")) {
          ws.close()
        }
      })

      ws.on("close", () => resolve(Buffer.concat(audioChunks)))
      ws.on("error", err => reject(err))
    })
  }
}

// ===================================================
// =============== BOT HANDLER CODE ==================
// ===================================================

let handler = async (m, { conn, text }) => {

  if (!text)
    return m.reply(`❗ *Usage:*\n> .tts <text>|<voice>\n\nDefault voice = Arabic (ar-SA-HamedNeural)`)

  const [txt, voice] = text.split("|")

  try {
    const api = new VoicerTool()
    const audio = await api.generate({ text: txt, voice })

    await conn.sendMessage(
      m.chat,
      { audio, mimetype: "audio/mpeg", ptt: false },
      { quoted: m }
    )

  } catch (err) {
    console.error(err)
    m.reply("❌ Failed to generate voice.")
  }
}

handler.help = ['tts2']
handler.tags = ['tools']
handler.command = ['tts2']
handler.limit = true

export default handler
