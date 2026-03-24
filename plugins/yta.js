/**
 * plugin by noureddine ouafy 
 🍀 YouTube Audio Downloader Handler (ytdown.to)
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

async function ytdownAudio(url) {
  try {
    const { data } = await axios.post(
      "https://app.ytdown.to/proxy.php",
      qs.stringify({ url }),
      { headers, timeout: 20000 }
    )

    if (data?.api?.status !== "ok") return { status: false }

    let bestAudio = null
    let fallbackAudio = null

    for (let item of data.api.mediaItems) {
      if (item.type !== "Audio") continue

      const res = await convert(item.mediaUrl)
      if (!res) continue

      const ext = res.fileName?.split(".").pop()?.toLowerCase()

      const obj = {
        url: res.fileUrl,
        size: res.fileSize,
        ext,
        mime: "audio/" + ext
      }

      if (ext === "mp3" && !bestAudio) bestAudio = obj
      if (!fallbackAudio) fallbackAudio = obj
    }

    return {
      status: true,
      title: data.api.title,
      channel: data.api.userInfo?.name,
      thumbnail: data.api.imagePreviewUrl,
      duration: data.api.mediaItems?.[0]?.mediaDuration,
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
║   🎵 YouTube Audio Downloader ║
╚══════════════════════════════╝

Download the audio (MP3) from any YouTube video.

📌 *Command:* .yta

📖 *Usage:*
  .yta <YouTube URL>

💡 *Examples:*
  .yta https://youtu.be/xxxxx
  .yta https://www.youtube.com/watch?v=xxxxx

⚠️ *Notes:*
  • Audio is downloaded in MP3 format
  • Supports youtube.com and youtu.be links
  • Great for music, podcasts, and lectures
  • Processing may take a few seconds
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

  // Validate YouTube URL
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  if (!ytRegex.test(url)) {
    return conn.reply(
      m.chat,
      `❌ *Invalid URL!*\n\nPlease provide a valid YouTube link.\n\nExample:\n.yta https://youtu.be/xxxxx`,
      m
    )
  }

  // Send processing message
  await conn.reply(m.chat, `⏳ *Processing...*\nExtracting audio 🎵, please wait.`, m)

  // Fetch audio data
  const result = await ytdownAudio(url)

  if (!result.status) {
    return conn.reply(
      m.chat,
      `❌ *Download Failed!*\n\nCould not fetch the audio. The link may be:\n• Private or age-restricted\n• Unavailable in your region\n• Invalid\n\nPlease try again.`,
      m
    )
  }

  const { title, channel, thumbnail, duration, audio } = result

  if (!audio?.url) {
    return conn.reply(
      m.chat,
      `❌ *Audio not available* for this video.\n\nThis video may not have a downloadable audio track.`,
      m
    )
  }

  const caption = [
    `🎵 *${title}*`,
    `👤 Channel: ${channel || "Unknown"}`,
    `⏱ Duration: ${duration || "N/A"}`,
    `🎧 Format: MP3`,
    `📦 Size: ${audio.size || "N/A"}`
  ].join("\n")

  try {
    // Send thumbnail with info first
    await conn.sendMessage(m.chat, {
      image: { url: thumbnail },
      caption
    }, { quoted: m })

    // Send audio file
    await conn.sendMessage(m.chat, {
      audio: { url: audio.url },
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`
    }, { quoted: m })

  } catch (sendErr) {
    return conn.reply(
      m.chat,
      `⚠️ *Failed to send the audio file.*\n\nThe file may be too large or unavailable. Please try again.`,
      m
    )
  }
}

// ─────────────────────────────────────────────
// HANDLER META
// ─────────────────────────────────────────────

handler.help = ["yta"]
handler.command = ["yta"]
handler.tags = ["downloader"]
handler.limit = true
export default handler
