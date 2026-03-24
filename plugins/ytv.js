/**
 * plugin by noureddine ouafy 
 🍀 YouTube Video Downloader Handler (ytdown.to)
 * CR Ponta CT
 * CH https://whatsapp.com/channel/0029VagslooA89MdSX0d1X1z
 * WEB https://my.codeteam.web.id
**/

import axios from "axios"
import qs from "qs"

// ─────────────────────────────────────────────
// CORE SCRAPER
// ─────────────────────────────────────────────

const headers = {
  "accept": "*/*",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "x-requested-with": "XMLHttpRequest",
  "referer": "https://app.ytdown.to/id21/",
  "origin": "https://app.ytdown.to"
}

function normalizeQ(q = "") {
  q = q.toLowerCase()
  if (q.includes("1080") || q.includes("fhd")) return "1080"
  if (q.includes("720") || q.includes("hd")) return "720"
  if (q.includes("480")) return "480"
  if (q.includes("360") || q.includes("sd")) return "360"
  if (q.includes("240")) return "240"
  if (q.includes("144")) return "144"
  return ""
}

async function convert(url) {
  try {
    const { data } = await axios.post(
      "https://app.ytdown.to/proxy.php",
      qs.stringify({ url }),
      { headers, timeout: 20000 }
    )
    return data?.api?.status === "completed" ? data.api : null
  } catch {
    return null
  }
}

async function ytdown(url, quality = "720") {
  try {
    const { data } = await axios.post(
      "https://app.ytdown.to/proxy.php",
      qs.stringify({ url }),
      { headers, timeout: 20000 }
    )

    if (data?.api?.status !== "ok") return { status: false }

    const targetQ = normalizeQ(quality)

    let selectedVideo = null
    let fallbackVideo = null
    let bestAudio = null
    let fallbackAudio = null

    for (let item of data.api.mediaItems) {
      const res = await convert(item.mediaUrl)
      if (!res) continue

      const ext = res.fileName?.split(".").pop()?.toLowerCase()

      const obj = {
        quality: item.mediaQuality,
        url: res.fileUrl,
        size: res.fileSize,
        ext,
        mime: item.type === "Video" ? "video/" + ext : "audio/" + ext
      }

      if (item.type === "Video") {
        const qNum = normalizeQ(item.mediaQuality)
        if (qNum == targetQ && !selectedVideo) selectedVideo = obj
        if (!fallbackVideo || Number(qNum) > Number(normalizeQ(fallbackVideo.quality))) {
          fallbackVideo = obj
        }
      }

      if (item.type === "Audio") {
        if (ext === "mp3" && !bestAudio) bestAudio = obj
        if (!fallbackAudio) fallbackAudio = obj
      }
    }

    return {
      status: true,
      title: data.api.title,
      channel: data.api.userInfo?.name,
      thumbnail: data.api.imagePreviewUrl,
      duration: data.api.mediaItems?.[0]?.mediaDuration,
      video: selectedVideo || fallbackVideo,
      audio: bestAudio || fallbackAudio
    }

  } catch (e) {
    return { status: false, error: String(e) }
  }
}

// ─────────────────────────────────────────────
// GUIDE
// ─────────────────────────────────────────────

const GUIDE = `
╔══════════════════════════════╗
║   🎬 YouTube Video Downloader ║
╚══════════════════════════════╝

Download YouTube videos in your preferred quality.

📌 *Command:* .ytv

📖 *Usage:*
  .ytv <YouTube URL> [quality]

🎯 *Available Quality Options:*
  144 | 240 | 360 | 480 | 720 | 1080

💡 *Examples:*
  .ytv https://youtu.be/xxxxx
  .ytv https://youtu.be/xxxxx 720
  .ytv https://youtu.be/xxxxx 1080p

⚠️ *Notes:*
  • Default quality is 720p
  • If your chosen quality isn't available,
    the best available quality will be used
  • Supports youtube.com and youtu.be links
  • Large files may take a moment to process
`.trim()

// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────

let handler = async (m, { conn, args }) => {

  // Show guide if no arguments provided
  if (!args[0]) {
    return conn.reply(m.chat, GUIDE, m)
  }

  const url = args[0]
  const quality = args[1] || "720"

  // Validate YouTube URL
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  if (!ytRegex.test(url)) {
    return conn.reply(
      m.chat,
      `❌ *Invalid URL!*\n\nPlease provide a valid YouTube link.\n\nExample:\n.ytv https://youtu.be/xxxxx 720`,
      m
    )
  }

  // Send processing message
  await conn.reply(m.chat, `⏳ *Processing...*\nFetching video 🎬 in *${quality}* quality, please wait.`, m)

  // Fetch download data
  const result = await ytdown(url, quality)

  if (!result.status) {
    return conn.reply(
      m.chat,
      `❌ *Download Failed!*\n\nCould not fetch the video. The link may be:\n• Private or age-restricted\n• Unavailable in your region\n• Invalid\n\nPlease try again.`,
      m
    )
  }

  const { title, channel, thumbnail, duration, video } = result

  if (!video?.url) {
    return conn.reply(
      m.chat,
      `❌ *Video not available* at the requested quality.\n\nTry a lower quality:\n.ytv ${url} 360`,
      m
    )
  }

  const caption = [
    `🎬 *${title}*`,
    `👤 Channel: ${channel || "Unknown"}`,
    `⏱ Duration: ${duration || "N/A"}`,
    `📹 Quality: ${video.quality || "Best available"}`,
    `📦 Size: ${video.size || "N/A"}`
  ].join("\n")

  try {
    await conn.sendMessage(m.chat, {
      video: { url: video.url },
      mimetype: video.mime || "video/mp4",
      caption,
      fileName: `${title}.mp4`
    }, { quoted: m })

  } catch (sendErr) {
    return conn.reply(
      m.chat,
      `⚠️ *File too large or failed to send.*\n\nTry a lower quality:\n.ytv ${url} 360`,
      m
    )
  }
}

// ─────────────────────────────────────────────
// HANDLER META
// ─────────────────────────────────────────────

handler.help = ["ytv"]
handler.command = ["ytv"]
handler.tags = ["downloader"]
handler.limit = true
export default handler
