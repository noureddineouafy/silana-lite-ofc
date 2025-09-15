/*
  feature : Spotify Downloader (direct mp3)
  plugin by  : noureddine
  scrape by  : malik
*/

import axios from "axios"
import * as cheerio from "cheerio"

class SpotifyDownloader {
  constructor() {
    this.baseUrl = "https://spotifydownloader.pro/"
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        referer: this.baseUrl,
        "sec-fetch-mode": "navigate",
        "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
      }
    })
  }

  async fetchCookies() {
    const res = await this.client.get("/")
    const cookies = res.headers["set-cookie"]?.map(c => c.split(";")[0]).join("; ") || ""
    this.client.defaults.headers.cookie = cookies
  }

  async download(url) {
    if (!this.client.defaults.headers.cookie) await this.fetchCookies()
    const res = await this.client.post("/", `url=${encodeURIComponent(url)}`, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: this.baseUrl
      }
    })
    return this.parseResponse(res.data)
  }

  parseResponse(html) {
    const $ = cheerio.load(html)
    const results = $(".res_box tr").map((_, el) => ({
      title: $(el).find(".rb_title").text().trim() || "No Title",
      artist: $(el).find(".rb_title em, .rb_title span").text().trim() || "Unknown",
      image: $(el).find(".rb_icon").attr("src") || "",
      link: $(el).find(".rb_btn").attr("href") || ""
    })).get()
    return results
  }
}

// ===== handler =====
let handler = async (m, { conn, text }) => {
  if (!text) throw `⚠️ Please provide a Spotify link!`

  try {
    const spotify = new SpotifyDownloader()
    const result = await spotify.download(text)

    if (!result.length) throw `❌ No results found.`

    const track = result[0] // ناخدو أول نتيجة

    // إرسال الملف الصوتي مباشرة mp3
    await conn.sendMessage(m.chat, {
      audio: { url: track.link },
      mimetype: 'audio/mpeg',
      fileName: `${track.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: track.title,
          body: track.artist,
          thumbnailUrl: track.image,
          sourceUrl: text
        }
      }
    }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ Failed: ${e.message}` }, { quoted: m })
  }
}

handler.help = handler.command = ['spotidown']
handler.tags = ['downloader']
handler.limit = true

export default handler
