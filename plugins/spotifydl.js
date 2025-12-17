// Hecho por Ado
// plugin by instagram.com/noureddine_ouafy
import fetch from "node-fetch"
import fs from "fs"
import path from "path"

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat,
      `❌ *Missing Spotify link*

📌 *How to use this feature:*
1. Copy a Spotify song link
2. Send it with the command below

✅ *Example:*
${usedPrefix}${command} https://open.spotify.com/track/1Yk0cQdMLx5RzzFTYwmuld

🎵 The bot will download the song and send it as an MP3.`,
      m
    )
  }

  const QUERY = args[0]
  const OUTPUT_PATH = `./tmp/${Date.now()}.mp3`

  try {
    await conn.reply(m.chat, "⏳ Searching and downloading the song...", m)

    const song = await searchSong(QUERY)
    await downloadSong(song.url, OUTPUT_PATH)

    await conn.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(OUTPUT_PATH),
        mimetype: "audio/mpeg",
        fileName: `${song.title}.mp3`,
        caption:
          `🎶 *Spotify Downloader*\n\n` +
          `• *Title:* ${song.title}\n` +
          `• *Artist:* ${song.artist}\n` +
          `• *Duration:* ${song.duration || "Unknown"}`
      },
      { quoted: m }
    )

    fs.unlinkSync(OUTPUT_PATH)
  } catch (err) {
    conn.reply(
      m.chat,
      `❌ *Failed to download song*\n\nError: ${err.message}`,
      m
    )
  }
}

handler.help = ["spotifydl"]
handler.command = ["spotifydl"]
handler.tags = ["downloader"]
handler.limit = true

export default handler

// ================= FUNCTIONS =================

async function searchSong(query) {
  const res = await fetch(
    `https://spotdown.org/api/song-details?url=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json, text/plain, */*"
      }
    }
  )

  if (!res.ok) throw new Error("Song search failed")

  const data = await res.json()
  if (!data.songs || data.songs.length === 0)
    throw new Error("No songs found")

  return data.songs[0]
}

async function downloadSong(songUrl, outputPath) {
  const res = await fetch("https://spotdown.org/api/download", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: songUrl })
  })

  if (!res.ok || !res.body) throw new Error("Download failed")

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const fileStream = fs.createWriteStream(outputPath)

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream)
    res.body.on("error", reject)
    fileStream.on("finish", resolve)
  })
}
