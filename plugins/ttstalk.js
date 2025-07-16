// @instagram: noureddine_ouafy
// 📌 Plugin: TikTok Stalker
// scrape by GilangSan
import axios from 'axios'

const headers = {
  "Content-Type": 'application/json',
  Origin: 'https://tokviewer.net',
  Referer: 'https://tokviewer.net/id',
  "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
}

async function ttStalk(username, limit = 10) {
  if (!username) return '⚠️ Please provide a TikTok username!'
  try {
    let user = await axios.post('https://tokviewer.net/api/check-profile', {
      username
    }, { headers })

    let video = await axios.post('https://tokviewer.net/api/video', {
      username,
      offset: 0,
      limit
    }, { headers })

    return {
      profile: user.data.data,
      video: video.data.data
    }
  } catch (e) {
    return `❌ Error: ${e.message}`
  }
}

let handler = async (m, { args }) => {
  const username = args[0]
  if (!username) return m.reply('👤 Please enter a TikTok username.\n\nExample:\n.ttstalk bzrk_killer')

  let result = await ttStalk(username)
  if (typeof result === 'string') return m.reply(result)

  let { profile, video } = result

  let caption = `👤 *TikTok Profile Stalker*\n\n`
  caption += `📛 *Username:* ${profile.username}\n`
  caption += `🆔 *ID:* ${profile.user_id}\n`
  caption += `📄 *Bio:* ${profile.bio || 'No bio'}\n`
  caption += `👥 *Followers:* ${profile.follower}\n`
  caption += `👤 *Following:* ${profile.following}\n`
  caption += `❤️ *Likes:* ${profile.likes}\n`
  caption += `🎥 *Total Videos:* ${profile.video}\n`
  caption += `\n🔗 *Profile URL:* https://tiktok.com/@${profile.username}\n`

  if (video.length > 0) {
    caption += `\n🎬 *Latest Videos:*\n`
    caption += video.map((v, i) => `• ${i + 1}. ${v.desc || '(No description)'}\n🔗 https://www.tiktok.com/@${username}/video/${v.video_id}`).join('\n\n')
  }

  m.reply(caption)
}

handler.help = handler.command = ['ttstalk']
handler.tags = ['tools']
handler.limit = true
export default handler
