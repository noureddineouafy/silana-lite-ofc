// scrape by github=zaenal-iyyl
// plugin by noureddine ouafy 

import axios from "axios"

async function capcutDownloader(url) {
  try {
    const headers = {
      "accept": "application/json, text/plain, */*",
      "content-type": "application/json"
    }

    const { data } = await axios.post("https://3bic.com/api/download", { url }, { headers })

    if (!data || !data.originalVideoUrl) {
      return { status: false, msg: "Failed to fetch data" }
    }

    const base64url = data.originalVideoUrl.split("/api/cdn/")[1]
    const video = Buffer.from(base64url, "base64").toString()

    return {
      status: true,
      title: data.title || "",
      author: data.authorName || "",
      thumbnail: data.coverUrl || "",
      video
    }
  } catch (err) {
    return { status: false, msg: err.message }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) throw `Please provide a Capcut link ex : \n\n .capcut-dl https://www.capcut.net/sharevideo?template_id=7446548553788411141`

  let res = await capcutDownloader(text)
  if (!res.status) throw res.msg

  await conn.sendMessage(m.chat, {
    video: { url: res.video },
    caption: `🎬 *${res.title}*\n👤 Author: ${res.author}`
  }, { quoted: m })
}

handler.help = handler.command = ['capcut-dl']
handler.tags = ['downloader']
handler.limit = true

export default handler
