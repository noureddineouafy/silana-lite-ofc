//plugin by noureddine ouafy 
// scrape by rizki 

import axios from 'axios'
import cheerio from 'cheerio'

class MediaFire {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
  }

  async getFileInfo(url) {
    const res = await this.client.get(url)
    const $ = cheerio.load(res.data)

    const link = $('#downloadButton').attr('href') || null
    const name =
      $('.dl-btn-label').attr('title') ||
      $('.promoDownloadName .dl-btn-label').text().trim() ||
      'file'

    const size =
      $('.download_link .input').text().match(/\(([^)]+)\)/)?.[1] ||
      $('.details .size').text().trim() ||
      '-'

    return { link, name, size }
  }
}

let handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      return m.reply(`❌ Please provide a MediaFire link.`)
    }

    if (!text.includes('mediafire.com')) {
      return m.reply(`❌ Invalid MediaFire link.`)
    }

    m.reply('⏳ Downloading file, please wait...')

    const mf = new MediaFire()
    const res = await mf.getFileInfo(text)

    if (!res.link) {
      return m.reply('❌ Failed to get download link.')
    }

    // إرسال الملف مباشرة
    await conn.sendFile(
      m.chat,
      res.link,
      res.name,
      `✅ *File Sent Successfully!*\n\n📄 Name: ${res.name}\n📦 Size: ${res.size}`,
      m
    )

  } catch (e) {
    console.error(e)
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['mediafire-dl']
handler.command = ['mediafire-dl']
handler.tags = ['downloader']
handler.limit = true

export default handler
