// instagram.com/noureddine_ouafy
// Plugin: YouTube Downloader (Video/Audio)
// Source: www.clipto.com API
// Note: Use `.youtube <YouTube_URL>`
// Fitur By Anomaki Team
// Created : xyzan code
import axios from 'axios'

async function ytdlid(videoUrl) {
  try {
    const res = await axios.post(
      'https://www.clipto.com/api/youtube',
      { url: videoUrl },
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://www.clipto.com/id/media-downloader/youtube-downloader',
        },
      }
    )
    return res.data
  } catch (error) {
    return {
      error: 'Failed to fetch data from API.',
      details: error.message,
    }
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0] || !args[0].includes('youtube.com') && !args[0].includes('youtu.be')) {
    throw '❌ Please provide a valid YouTube URL.\nExample: .ytdl https://youtu.be/xyz'
  }

  m.reply('⏳ Please wait while I fetch the video...')

  const result = await ytdlid(args[0])

  if (result.error) throw `🚫 Error: ${result.details}`

  if (!result || !result.medias || result.medias.length === 0) {
    throw '❌ Failed to extract video/audio. Try another link.'
  }

  const videoInfo = result.title || 'YouTube Video'
  const media = result.medias.find(m => m.extension === 'mp4') || result.medias[0]

  await conn.sendFile(m.chat, media.url, `ytdl.${media.extension}`, `🎬 *${videoInfo}*\n📥 Format: ${media.extension.toUpperCase()}`, m)
}

handler.help = handler.command = ['youtube']
handler.tags = ['downloader']
handler.limit = true

export default handler
