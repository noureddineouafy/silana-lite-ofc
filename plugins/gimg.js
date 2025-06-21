// instagram.com/noureddine_ouafy
// scrape by wolfyflutter thanks brother 
import fetch from 'node-fetch'

const googleSearchImage = async (query) => {
  if (!query) throw Error('Search query must not be empty')
  
  const usp = {
    "as_st": "y",
    "as_q": query,
    "imgsz": "l",
    "imgtype": "jpg",
    "udm": "2"
  }

  const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
  }

  const response = await fetch("https://www.google.com/search?" + new URLSearchParams(usp).toString(), { headers })
  if (!response.ok) throw Error(`Failed to fetch: ${response.status} ${response.statusText}`)

  const html = await response.text()
  const match = html.match(/var m=(.*?);var a=m/)?.[1] || null
  if (!match) throw Error("No data found in the HTML")

  const json = JSON.parse(match)
  const images = Object.entries(json)
    .filter(v => v[1]?.[1]?.[3]?.[0])
    .map(v => ({
      title: v[1]?.[1]?.[25]?.[2003]?.[3] || null,
      imageUrl: v[1][1][3][0] || null,
      height: v[1][1][3][1] || null,
      width: v[1][1][3][2] || null,
      imageSize: v[1]?.[1]?.[25]?.[2000]?.[2] || null,
      referer: v[1]?.[1]?.[25]?.[2003]?.[2] || null,
      aboutUrl: v[1]?.[1]?.[25]?.[2003]?.[33] || null
    }))

  if (!images.length) throw Error(`No image results for "${query}"`)
  images.pop() // remove last

  return { total: images.length, images }
}

let handler = async (m, { conn, args }) => {
  const query = args.join(' ')
  if (!query) return m.reply('📸 Please provide a search term. Example:\n.gimg cat')

  try {
    const result = await googleSearchImage(query)
    const img = result.images[Math.floor(Math.random() * result.images.length)]
    await conn.sendFile(m.chat, img.imageUrl, 'image.jpg', `📍 Result for: *${query}*\n🔗 Source: ${img.referer || 'unknown'}`, m)
  } catch (e) {
    m.reply(`❌ Error:\n${e.message}`)
  }
}

handler.help = ['gimg']
handler.tags = ['downloader']
handler.command = ['gimg']
handler.limit = true
export default handler
