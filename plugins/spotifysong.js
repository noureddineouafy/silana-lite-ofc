// Instagram: noureddine_ouafy
// Spotify Downloader via spotisongdownloader.to
// scrape by daffa nb scripts 
import axios from "axios"
import crypto from "crypto"

const spotifyTrackDownloader = async (spotifyTrackUrl) => {
  const client = new axios.create({
    baseURL: "https://spotisongdownloader.to",
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      "cookie": `PHPSESSID=${crypto.randomBytes(16).toString("hex")}; _ga=GA1.1.2675401.${Math.floor(Date.now() / 1000)}`,
      "referer": "https://spotisongdownloader.to",
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })

  // metadata
  const { data: meta } = await client.get("/api/composer/spotify/xsingle_track.php", {
    params: { url: spotifyTrackUrl }
  })

  // fake visit
  await client.post("/track.php")

  // download link
  const { data: dl } = await client.post("/api/composer/spotify/ssdw23456ytrfds.php", {
    url: spotifyTrackUrl,
    zip_download: "false",
    quality: "m4a"
  })

  return { ...dl, ...meta }
}

let handler = async (m, { conn, args }) => {
  try {
    if (!args[0]) {
      return m.reply(
        `⚠️ Example:\n.spotifysong https://open.spotify.com/track/5ljSDO6UpH02bQllrMR4Al`
      )
    }

    let result = await spotifyTrackDownloader(args[0])

    let caption = `🎶 *Spotify Downloader*\n\n`
    caption += `📌 *Title:* ${result.song_name}\n`
    caption += `👤 *Artist:* ${result.artist}\n`
    caption += `📀 *Album:* ${result.album_name}\n`
    caption += `⏱️ *Duration:* ${result.duration}\n`
    caption += `📅 *Release:* ${result.released}\n`
    caption += `🔗 *Link:* ${result.url}\n\n`
    caption += `> ⏳ Sending audio...`

    if (result.img) {
      await conn.sendMessage(
        m.chat,
        { image: { url: result.img }, caption },
        { quoted: m }
      )
    } else {
      await m.reply(caption)
    }

    if (result.dlink) {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: result.dlink },
          mimetype: "audio/mpeg",
          fileName: `${result.song_name || "spotify"}.mp3`
        },
        { quoted: m }
      )
    }
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ["spotifysong"]
handler.command = ["spotifysong"]
handler.tags = ["downloader"]

export default handler
