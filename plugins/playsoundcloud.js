// @instagram: noureddine_ouafy
// Plugin: Play from SoundCloud
// Description: Search and download tracks from SoundCloud
// scrape by SaaOffc
import axios from 'axios'

async function searchSoundCloud(query) {
  const response = await axios.get('https://izumi-apis.zone.id/search/soundcloudsrc', {
    params: { query }
  })
  if (response.data?.status && response.data?.result?.length > 0) {
    return response.data.result[0]
  } else {
    return null
  }
}

async function getSoundCloudTrack(trackUrl) {
  const response = await axios.post(
    'https://api.downloadsound.cloud/track',
    { url: trackUrl },
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://downloadsound.cloud/',
        'Origin': 'https://downloadsound.cloud/',
        'Content-Type': 'application/json'
      }
    }
  )

  const data = response.data

  return {
    url: data?.url || null,
    title: data?.title || null,
    author: data?.author || {},
    thumbnail: data?.imageURL
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`Please enter a song name to search.\n\nExample:\n${usedPrefix + command} Lofi study music`)
  }

  await m.reply('🔍 Searching on SoundCloud...')

  try {
    const search = await searchSoundCloud(args.join(' '))
    if (!search?.url) throw new Error('Track not found.')

    const result = await getSoundCloudTrack(search.url)

    let info = `🎵 *${result.title}*\n\n`
    info += `👤 Author: ${result.author.username}\n`
    info += `❤️ Likes: ${result.author.likes_count}\n`
    info += `🌍 Country: ${result.author.country_code || 'Unknown'}\n`
    info += `📅 Created: ${result.author.created_at}\n`
    info += `✅ Verified: ${result.author.verified ? 'Yes' : 'No'}\n`
    info += `🔗 Link: ${result.author.permalink_url}\n\n`
    info += `⏳ Please wait while I send the audio...`

    if (result.thumbnail) {
      await conn.sendMessage(m.chat, {
        image: { url: result.thumbnail },
        caption: info
      }, { quoted: m })
    } else {
      await m.reply(info)
    }

    await conn.sendMessage(m.chat, {
      audio: { url: result.url },
      mimetype: 'audio/mpeg',
      fileName: `${result.title}.mp3`
    }, { quoted: m })
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['playsoundcloud']
handler.command = ['playsoundcloud']
handler.tags = ['downloader']
handler.limit = true

export default handler
