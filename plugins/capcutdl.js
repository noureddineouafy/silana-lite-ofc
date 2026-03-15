// plugin by noureddine ouafy 
// scrape by andhikagg (NXNX.OSSYSTEM ARCHIVE)

import axios from "axios"

async function CapcutDl(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.34 Mobile Safari/537.36'
      }
    })

    if (!/\/template-detail\/\d/.test(res.request.res.responseUrl)) 
      throw new Error("Invalid CapCut template URL")

    const script = res.data.match(/id="__MODERN_ROUTER_DATA__">(.*?)<\/script>/)?.[1]
    if (!script) throw new Error("Failed to find template data")

    const data = JSON.parse(script).loaderData['template-detail_$']
    const detail = data.templateDetail

    return {
      id: detail.templateId,
      title: detail.structuredData.name,
      region: detail.ugcLang,
      duration: detail.templateDuration,
      upload_date: detail.createTime,
      statistic: {
        play: detail.playAmount,
        usage: detail.usageAmount,
        like: detail.likeAmount,
        comment: detail.commentAmount
      },
      author: {
        name: detail.author.name,
        avatar: detail.author.avatarUrl,
        bio: detail.author.description
      },
      video_detail: {
        ratio: detail.videoRatio,
        height: detail.videoHeight,
        width: detail.videoWidth
      },
      cover: detail.coverUrl,
      video: detail.videoUrl
    }

  } catch (e) {
    throw e
  }
}

let handler = async (m, { conn, text }) => {

  if (!text) {
    return m.reply(
`📌 *CapCut Template Downloader*

This feature allows you to download **CapCut template videos** directly from a template link.

🧾 *How to use:*
1. Open CapCut template in your browser
2. Copy the template link
3. Send the command like this:

.capcutdl <template_url>

Example:
.capcutdl https://www.capcut.com/tv2/ZSmekgy5T/
The bot will fetch:
• Template video
• Template information
• Author details
• Template statistics`
    )
  }

  try {

    const data = await CapcutDl(text)

    const caption = `
🎬 *CapCut Template Information*

📌 Title: ${data.title}
🆔 ID: ${data.id}
🌍 Region: ${data.region}
⏱ Duration: ${data.duration}

📊 *Statistics*
▶ Play: ${data.statistic.play}
📥 Usage: ${data.statistic.usage}
❤️ Likes: ${data.statistic.like}
💬 Comments: ${data.statistic.comment}

👤 *Author*
Name: ${data.author.name}
Bio: ${data.author.bio || "No bio"}

📐 *Video Detail*
Ratio: ${data.video_detail.ratio}
Resolution: ${data.video_detail.width}x${data.video_detail.height}
`

    await conn.sendFile(
      m.chat,
      data.video,
      "capcutdl.mp4",
      caption,
      m
    )

  } catch (err) {
    m.reply("❌ Failed to fetch CapCut template. Please make sure the link is valid.")
  }
}

handler.help = ['capcutdl']
handler.command = ['capcutdl']
handler.tags = ['downloader']
handler.limit = true

export default handler
