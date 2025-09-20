// instagram.com/noureddine_ouafy
// scrape by malik

import axios from "axios"
import crypto from "crypto"

// SpoofHead function merged inside
const SpoofHead = (extra = {}) => {
  const ip = [10, crypto.randomInt(256), crypto.randomInt(256), crypto.randomInt(256)].join(".")
  const genericHeaders = {
    "x-forwarded-for": ip,
    "x-real-ip": ip,
    "client-ip": ip,
    "x-client-ip": ip,
    "x-cluster-client-ip": ip,
    "x-original-forwarded-for": ip
  }
  return {
    ...genericHeaders,
    ...extra
  }
}

// ChordMiniAPI class
class ChordMiniAPI {
  constructor() {
    this.axios = axios.create({
      baseURL: "https://www.chordmini.me/api",
      headers: {
        accept: "*/*",
        "accept-language": "id-ID",
        "content-type": "application/json",
        origin: "https://www.chordmini.me",
        priority: "u=1, i",
        referer: "https://www.chordmini.me/?ref=aier.im",
        "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        ...SpoofHead()
      }
    })
  }

  async search({ query, ...rest }) {
    try {
      const searchResponse = await this.axios.post("/search-youtube", {
        query: query,
        maxResults: rest.maxResults || 10
      })
      const firstResult = searchResponse?.data?.results?.[0] || {}
      const { id: videoId, title } = firstResult
      if (!videoId) return null
      return await this.xtr({ videoId, title })
    } catch (error) {
      console.error("[ERROR] Search failed:", error.message)
      return null
    }
  }

  async xtr({ videoId, title }) {
    try {
      const extractResponse = await this.axios.post("/extract-audio", {
        videoId: videoId,
        forceRefresh: false,
        videoMetadata: {
          id: videoId,
          title: title
        },
        originalTitle: title
      })
      const audioUrl = extractResponse?.data?.audioUrl
      if (!audioUrl) return null

      const proxyUrl = `https://www.chordmini.me/api/proxy-audio?url=${encodeURIComponent(audioUrl)}`
      return {
        ...extractResponse.data,
        proxyUrl
      }
    } catch (error) {
      console.error(`[ERROR] Extract failed for videoId: ${videoId}:`, error.message)
      return null
    }
  }
}

// Plugin handler
let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return m.reply("⚠️ Please provide a search query.\nExample: *.chordmini Despacito*")
  }

  const query = args.join(" ")
  const chordApi = new ChordMiniAPI()
  const result = await chordApi.search({ query })

  if (!result) {
    return m.reply("❌ No results found.")
  }

  await conn.sendFile(m.chat, result.proxyUrl, `${result.title}.mp3`, `🎵 ${result.title}`, m)
}

handler.help = handler.command = ['chordmini']
handler.tags = ['downloader']
handler.limit = true

export default handler
