// instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios"
import * as cheerio from "cheerio"
import https from "https"

class SpotimateDownloader {
  constructor() {
    this.cookies = {}
    this.baseURL = "https://spotimate.app"
    this.agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })
    this.headers = {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "id-ID",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    }
  }

  handleCookies(response) {
    const setCookie = response.headers["set-cookie"]
    if (setCookie) {
      setCookie.forEach((cookie) => {
        const [cookieStr] = cookie.split(";")
        const [name, value] = cookieStr.split("=")
        this.cookies[name] = value
      })
    }
    const cookieHeader = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")
    return cookieHeader
  }

  async req(config) {
    const cookieHeader =
      Object.keys(this.cookies).length > 0
        ? this.handleCookies({ headers: {} })
        : ""
    const headers = {
      ...this.headers,
      ...(cookieHeader && { cookie: cookieHeader }),
      ...config.headers,
    }
    const response = await axios({
      ...config,
      headers,
      httpsAgent: this.agent,
      withCredentials: true,
    })
    this.handleCookies(response)
    return response.data
  }

  async getToken() {
    const html = await this.req({ method: "GET", url: this.baseURL })
    const $ = cheerio.load(html)
    const tokenInput = $('input[type="hidden"][name^="_"]').first()
    return {
      name: tokenInput.attr("name"),
      value: tokenInput.val(),
    }
  }

  async submitUrl(url) {
    const token = await this.getToken()
    const formData = new URLSearchParams()
    formData.append("url", url)
    formData.append(token?.name || "_KaxSY", token?.value || "")
    return await this.req({
      method: "POST",
      url: `${this.baseURL}/action`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: this.baseURL,
      },
      data: formData.toString(),
    })
  }

  async getTrackData(data) {
    const formData = new URLSearchParams()
    formData.append("data", data.data)
    formData.append("base", data.base)
    formData.append("token", data.token)
    return await this.req({
      method: "POST",
      url: `${this.baseURL}/action/track`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: this.baseURL,
      },
      data: formData.toString(),
    })
  }

  extractFormData($) {
    return {
      data: $('input[name="data"]').val(),
      base: $('input[name="base"]').val(),
      token: $('input[name="token"]').val(),
    }
  }

  extractMetadata($) {
    return {
      title: $(".hover-underline").text().trim() || "Unknown Title",
      artist:
        $(".spotifymate-middle p span").first().text().trim() || "Unknown Artist",
      cover: $(".spotifymate-left img").attr("src") || "",
    }
  }

  extractMediaLinks($) {
    const media = []
    $(".abuttons a").each((i, el) => {
      const href = $(el).attr("href")
      const text = $(el).text().trim()
      if (href?.includes("/dl?")) {
        media.push({
          url: `${this.baseURL}${href}`,
          type: text.includes("Mp3") ? "audio" : "other",
        })
      }
    })
    return media
  }

  async download({ url }) {
    const submitResponse = await this.submitUrl(url)
    const $1 = cheerio.load(submitResponse?.html || "")
    const formData = this.extractFormData($1)
    const trackResponse = await this.getTrackData(formData)
    const $2 = cheerio.load(trackResponse?.data || "")
    return {
      metadata: this.extractMetadata($2),
      media: this.extractMediaLinks($2),
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
    const downloader = new SpotimateDownloader()
    const response = await downloader.download({ url: spotifyUrl })
    if (!response?.media?.length)
      throw "❌ Failed to get download link."

    const mp3 = response.media.find((m) => m.type === "audio")
    if (!mp3) throw "❌ No MP3 link found."

    let caption = `🎵 *Spotify Downloader*\n\n📌 *Title:* ${response.metadata.title}\n👤 *Artist:* ${response.metadata.artist}`

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: mp3.url },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${response.metadata.title}.mp3`,
        caption,
      },
      { quoted: m }
    )
  } catch (e) {
    throw `❌ Error: ${e.message}`
  }
}

handler.help = ["spotimate"]
handler.tags = ["downloader"]
handler.command = ["spotimate"]
handler.limit = true

export default handler
