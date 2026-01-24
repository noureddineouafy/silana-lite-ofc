import axios from 'axios'
import cheerio from 'cheerio'

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    throw '❌ Please provide an SFile URL.\n\nExample:\n.sfile https://sfile.co/CwY59xc325C'
  }

  const url = args[0]

  try {
    const result = await sfile(url)

    if (!result.download_url) {
      throw '❌ Failed to retrieve the download link.'
    }

    let message = `
📁 *SFile Downloader Info*

• *File Name:* ${result.file_name || 'Unknown'}
• *File Size:* ${result.size_from_text || 'Unknown'}
• *Author:* ${result.author_name || 'Unknown'}
• *Upload Date:* ${result.upload_date || 'Unknown'}
• *Download Count:* ${result.download_count || 'Unknown'}

🔗 *Direct Download Link:*
${result.download_url}
    `.trim()

    await conn.sendMessage(m.chat, { text: message }, { quoted: m })
  } catch (err) {
    throw `❌ Error:\n${err.message || err}`
  }
}

handler.help = ['sfile']
handler.command = ['sfile']
handler.tags = ['downloader']
handler.limit = true

export default handler

// =========================
// SFILE SCRAPER FUNCTION
// =========================

async function sfile(url) {
  const headers = {
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K)',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9'
  }

  // Step 1: Load initial page
  const r1 = await axios.get(url, { headers })
  const cookie = (r1.headers['set-cookie'] || [])
    .map(v => v.split(';')[0])
    .join('; ')
  if (cookie) headers.cookie = cookie

  let $ = cheerio.load(r1.data)

  const file_name = $('h1').first().text().trim() || null
  const size_from_text =
    r1.data.match(/(\d+(?:\.\d+)?\s?(?:KB|MB|GB))/i)?.[1] || null

  const infoText =
    $('meta[property="og:description"]').attr('content') || ''

  const author_name =
    infoText.match(/uploaded by\s([^ ]+)/i)?.[1] || null
  const upload_date =
    infoText.match(/on\s(\d+\s[A-Za-z]+\s\d{4})/i)?.[1] || null

  const download_count =
    $('span')
      .filter((_, el) =>
        $(el).text().toLowerCase().includes('download')
      )
      .first()
      .text()
      .match(/\d+/)?.[0] || null

  const pageurl = $('meta[property="og:url"]').attr('content')
  if (!pageurl) {
    return {
      file_name,
      size_from_text,
      author_name,
      upload_date,
      download_count,
      download_url: null
    }
  }

  // Step 2: Open download page
  headers.referer = url
  const r2 = await axios.get(pageurl, { headers })
  $ = cheerio.load(r2.data)

  const gateUrl = $('#download').attr('href')
  if (!gateUrl) {
    return {
      file_name,
      size_from_text,
      author_name,
      upload_date,
      download_count,
      download_url: null
    }
  }

  // Step 3: Extract final download link
  headers.referer = pageurl
  const r3 = await axios.get(gateUrl, { headers })

  const scripts = cheerio
    .load(r3.data)('script')
    .map((_, el) => cheerio.load(el).html())
    .get()
    .join('\n')

  const final = scripts.match(
    /https:\\\/\\\/download\d+\.sfile\.(?:co|mobi)\\\/downloadfile\\\/\d+\\\/\d+\\\/[a-z0-9]+\\\/[^"'\\\s]+(\?[^"']+)?/i
  )

  const download_url = final
    ? final[0].replace(/\\\//g, '/')
    : null

  return {
    file_name,
    size_from_text,
    author_name,
    upload_date,
    download_count,
    download_url
  }
}
