/*
📌 Name : Twitter Stalker
🏷️ scrape : ZenzzXD
👤 Source : snaplytics.io (via twittermedia CDN)
✍️ Converted by : ChatGPT and instagram.com/noureddine_ouafy
*/

import axios from 'axios'
import crypto from 'crypto'

async function twitterStalk(username) {
    if (!username) throw new Error('Username is required')

    // Get challenge
    const ch = await axios.get(
        'https://twittermedia.b-cdn.net/challenge/',
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'Accept': 'application/json',
                origin: 'https://snaplytics.io',
                referer: 'https://snaplytics.io/'
            }
        }
    ).then(r => r.data)

    if (!ch.challenge_id) throw new Error('Challenge failed')

    // Solve challenge
    const hash = crypto
        .createHash('sha256')
        .update(String(ch.timestamp) + ch.random_value)
        .digest('hex')
        .slice(0, 8)

    // Get profile
    const res = await axios.get(
        `https://twittermedia.b-cdn.net/viewer/?data=${username}&type=profile`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'Accept': 'application/json',
                origin: 'https://snaplytics.io',
                referer: 'https://snaplytics.io/',
                'X-Challenge-ID': ch.challenge_id,
                'X-Challenge-Solution': hash
            }
        }
    )

    if (!res.data || !res.data.profile) {
        throw new Error('No profile data found')
    }

    return res.data.profile
}

const handler = async (m, { text, conn }) => {
    if (!text) {
        throw 'Please enter a Twitter username\nExample: .twitterstalk mrbeast'
    }

    try {
        const data = await twitterStalk(text)

        const result = `
🐦 *Twitter Profile Stalker*

👤 *Name* : ${data.name}
🔗 *Username* : ${data.username || 'N/A'}
✔️ *Verified* : ${data.verified ? 'Yes' : 'No'}

📝 *Bio* :
${data.bio || '-'}

📊 *Stats*
📝 Tweets    : ${data.stats.tweets}
👥 Followers : ${data.stats.followers}
➡️ Following : ${data.stats.following}
        `.trim()

        await conn.sendMessage(
            m.chat,
            {
                text: result,
                contextInfo: {
                    externalAdReply: {
                        title: data.name,
                        body: data.bio || 'Twitter Profile',
                        thumbnailUrl: data.avatar_url,
                        sourceUrl: `https://twitter.com/${text}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: m }
        )

    } catch (e) {
        await conn.sendMessage(
            m.chat,
            { text: `❌ Error\n${e.message}` },
            { quoted: m }
        )
    }
}

handler.help = ['twitterstalk']
handler.tags = ['tools']
handler.command = /^(twitterstalk)$/i
handler.limit = false

export default handler
