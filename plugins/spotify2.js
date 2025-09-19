// instagram.com/noureddine_ouafy
import axios from "axios"
import * as cheerio from "cheerio"

class SpotdlDownloader {
  constructor(baseURL, headers) {
    this.cookieStore = {}
    this.api = axios.create({
      baseURL: baseURL || "https://spotdl.io",
      headers: headers || {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "id-ID",
        Priority: "u=1, i",
      },
    })
    this.setupInterceptors()
    this.csrfToken = null
  }

  setupInterceptors() {
    this.api.interceptors.response.use(
      (response) => {
        const setCookieHeader = response.headers["set-cookie"]
        if (setCookieHeader) {
          setCookieHeader.forEach((cookieString) => {
            const cookiePair = cookieString.split(";")[0]
            const [name, value] = cookiePair.split("=")
            if (name && value) {
              this.cookieStore[name.trim()] = value.trim()
            }
          })
        }
        return response
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.request.use(
      (config) => {
        const cookieKeys = Object.keys(this.cookieStore)
        if (cookieKeys.length > 0) {
          const cookieString = cookieKeys
            .map((key) => `${key}=${this.cookieStore[key]}`)
            .join("; ")
          config.headers["Cookie"] = cookieString
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  async getToken() {
    try {
      const response = await this.api.get("/")
      const html = response.data
      const $ = cheerio.load(html)
      const token = $('meta[name="csrf-token"]').attr("content") || null
      if (token) {
        this.csrfToken = token
        this.api.defaults.headers.common["x-csrf-token"] = this.csrfToken
      }
      return this.csrfToken
    } catch (error) {
      throw error
    }
  }

  async getTrack(spotifyUrl) {
    if (!this.csrfToken) await this.getToken()
    try {
      const response = await this.api.post("/getTrackData", {
        spotify_url: spotifyUrl,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  async convert(trackUrl) {
    try {
      const response = await this.api.post("/convert", { urls: trackUrl })
      return response.data
    } catch (error) {
      throw error
    }
  }

  async download({ url }) {
    try {
      const meta = await this.getTrack(url)
      const convertResponse = await this.convert(url)
      const finalUrl = convertResponse?.url || null
      if (!finalUrl) return null
      return {
        result: finalUrl,
        ...meta,
      }
    } catch (error) {
      return null
    }
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) throw "⚠️ Please provide a Spotify link."

  let spotifyUrl = args[0]
  if (!spotifyUrl.includes("open.spotify.com"))
    throw "⚠️ Invalid Spotify URL."

  m.reply("⏳ Please wait, downloading your track...")

  try {
    const downloader = new SpotdlDownloader()
    const response = await downloader.download({ url: spotifyUrl })

    if (!response || !response.result)
      throw "❌ Failed to get download link."

    let caption = `🎵 *Spotify Downloader*\n\n📌 *Title:* ${response?.title || "-"}\n👤 *Artist:* ${response?.artist || "-"}`

    // send mp3 directly
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: response.result },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${response?.title || "track"}.mp3`,
        caption,
      },
      { quoted: m }
    )
  } catch (e) {
    throw `❌ Error: ${e.message}`
  }
}

handler.help = ["spotify2"]
handler.tags = ["downloader"]
handler.command = ["spotify2"]
handler.limit = true

export default handler
