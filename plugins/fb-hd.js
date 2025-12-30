// plugin by instagram.com/noureddine_ouafy
// scrape by ZenzzXD

import axios from 'axios'
import cheerio from 'cheerio'

async function fbdl(url){
  try{
    const r = await axios.post('https://v3.fdownloader.net/api/ajaxSearch',
      new URLSearchParams({
        q: url,
        lang: 'en',
        web: 'fdownloader.net',
        v: 'v2',
        w: ''
      }).toString(),
      {
        headers:{
          'content-type':'application/x-www-form-urlencoded; charset=UTF-8',
          origin:'https://fdownloader.net',
          referer:'https://fdownloader.net/',
          'user-agent':'Mozilla/5.0 (Linux; Android 10)'
        }
      }
    )

    const $ = cheerio.load(r.data.data)

    return {
      duration: $('.content p').first().text().trim() || null,
      thumbnail: $('.thumbnail img').attr('src') || null,
      videos: $('.download-link-fb').map((_,el)=>({
        quality: $(el).attr('title')?.replace('Download ','') || '',
        url: $(el).attr('href')
      })).get()
    }

  }catch(e){
    return { status:'error', msg:e.message }
  }
}


/* ─────────────────────────────────────
            HANDLER COMMAND
────────────────────────────────────── */

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply(`
📌 *Facebook Video Downloader (HD)*
Send a Facebook video link to download it in HD.

**Example:**
.fb https://www.facebook.com/watch?v=xxxxxxxx
`)

  let url = args[0]
  m.reply(`⏳ *Fetching video... please wait.*`)

  let data = await fbdl(url)
  if (!data || !data.videos) return m.reply(`❌ Failed to extract download link.`)

  // get HD or fallback to the first link
  let hd = data.videos.find(v => v.quality.toLowerCase().includes('720')) || data.videos[0]

  if (!hd?.url) return m.reply(`⚠️ HD video not found, please try another link.`)

  try {
    await conn.sendMessage(m.chat, {
      video: { url: hd.url },
      caption: `🎥 *Downloaded in HD (720p)*\nDuration: ${data.duration || 'Unknown'}`
    }, { quoted: m })
  } catch (e) {
    return m.reply(`⚠️ Error sending the video: ${e.message}`)
  }
}

handler.help = handler.command = ['fb-hd']
handler.tags = ['downloader']
handler.limit = true

export default handler
