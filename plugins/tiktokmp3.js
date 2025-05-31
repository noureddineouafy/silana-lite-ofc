// plugin by Noureddine_ouafy
// scrape by GilangSan
import axios from 'axios'
import cheerio from 'cheerio'

async function tiktok(url) {
  let form = new URLSearchParams()
  form.append('q', url)
  form.append('lang', 'id')
  
  let { data } = await axios.post('https://tiksave.io/api/ajaxSearch', form, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': 'https://tiksave.io',
      'referer': 'https://tiksave.io/id/download-tiktok-mp3',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
    }
  })
  
  const $ = cheerio.load(data.data)
  let title = $('.tik-left').find('.content').text().trim()
  let thumbnail = $('.tik-left').find('img').attr('src')
  let video = $('.dl-action').find('p').first().find('a').attr('href')
  let audio = $('.dl-action').find('p').last().find('a').attr('href')
  let slide = []
  
  $('ul.download-box').find('li').each((i, e) => {
    slide.push($(e).find('img').attr('src'))
  })
  
  return {
    title,
    thumbnail,
    video,
    audio,
    slide
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Please provide a TikTok URL.')

  try {
    const result = await tiktok(text)
    if (!result.audio) return m.reply('Sorry, no audio found for this TikTok.')

    // Send the MP3 audio directly
    await conn.sendMessage(m.chat, {
      audio: { url: result.audio },
      mimetype: 'audio/mpeg',
      fileName: `${result.title || 'tiktok-audio'}.mp3`
    }, { quoted: m })

  } catch (e) {
    m.reply('Failed to fetch TikTok audio.')
    console.error(e)
  }
}

handler.help = ['tiktokmp3']
handler.tags = ['downloader']
handler.command = ['tiktokmp3']
handler.limit = true

export default handler
