import axios from 'axios'
import cheerio from 'cheerio'

let handler = async (m, { conn, args }) => {
  try {
    if (!args[0]) return m.reply('Where is the Pinterest link?')
    let pinterestUrl = args[0]
    
    let { csrfToken, cookies } = await getSnappinToken()
    let { data } = await axios.post('https://snappin.app/', { url: pinterestUrl }, {
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        Cookie: cookies,
        Referer: 'https://snappin.app',
        Origin: 'https://snappin.app',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    let $ = cheerio.load(data)
    let downloadLinks = $('a.button.is-success').map((_, el) => $(el).attr('href')).get()

    let mediaUrl = null
    for (let link of downloadLinks) {
      let fullLink = link.startsWith('http') ? link : 'https://snappin.app' + link
      let head = await axios.head(fullLink).catch(() => null)
      let contentType = head?.headers?.['content-type'] || ''
      
      if (contentType.includes('video')) {
        mediaUrl = { url: fullLink, type: 'video' }
        break
      } else if (contentType.includes('image')) {
        mediaUrl = { url: fullLink, type: 'image' }
      }
    }

    if (mediaUrl.type === 'video') {
      await conn.sendMessage(m.chat, { video: { url: mediaUrl.url } }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { image: { url: mediaUrl.url } }, { quoted: m })
    }
  } catch (e) {
    m.reply(e.message)
  }
}

async function getSnappinToken() {
  let { headers, data } = await axios.get('https://snappin.app/')
  let cookies = headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
  let $ = cheerio.load(data)
  let csrfToken = $('meta[name="csrf-token"]').attr('content')
  return { csrfToken, cookies }
}

handler.help = ['pindl']
handler.command = ['pindl']
handler.tags = ['downloader']
handler.limit = true 
export default handler
