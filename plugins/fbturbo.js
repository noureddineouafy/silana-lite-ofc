// instagram.com/noureddine_ouafy
// • Scrape : fesnuk downloader
// • Credits : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110

import axios from 'axios'
import * as cheerio from 'cheerio'

async function fbDownloaderTurbo(url) {
  try {
    const COOKIES = "webp=1794291132758; avif=1794291132758; i18n-activated-languages=en; snowflake=QokOqZp0G35224RVNvYqNg%3D%3D; lev=1; window-width=438; window-height=828; screen-width=438; screen-height=973; device-pixel-ratio=2.46875; time-zone=Asia%2FJakarta; js=1; session-secret=6f2ce1e7bc54104896742e09f6b3698658ef; device-token=m2RK028UzAtzhkI0%2F8yE9UE4; fingerprint=P9CIssKSMJl2I6eFwlqR7ZvAR--ifNSdLycoazx5Y9dN3plHAASRnQOTCM4CcSjFzmUgAACTCM4DY2PtziqgAACTCM4Aa5ncziHgAACTCM4A9aVMzkoAAACTCM4Aaq1qzhKgAAACTCM4DgZhazk5gAACTCM4DgZhgzk5gAACTCM4C1pTGzmuAAACTCM4DRvqZznKgAAACTCM4DNblFznsAAACTCM4Aewf5znkAAACTCM4Aa5nXziHgAAA; _gcl_au=1.1.688285144.1759896363; _ga=GA1.1.2103504426.1759896363; _fbp=fb.1.1759896363593.665804129147542269; FPID=FPID2.2.8vg8Txx9V4Q1lizx9snKo90IG7WcdSGE%2F7Ol8SgQYn4%3D.1759896363; FPLC=jQ0E6D6cK3h9L39HqnqLkvXQmnVDNrACPKVihaayHb%2FCQn01Ai%2BfqUoMpiNJ9E%2BdXB8h8szV%2Bm6U9c%2FkUlipO4xQWpwW2%2FCwsaDdB%2Bvxz9PPgtggSWlw8DeqOV%2BQ7A%3D%3D; FPAU=1.1.688285144.1759896363; _uetsid=1b82fad0a3fc11f08c0d2f89b39d825d; _uetvid=1b840ed0a3fc11f09ae2299fa4745046; _rdt_uuid=1759896363381.48e393d6-af27-4f2f-bd5e-2a432b556b73; _ga_LCTR22QQ87=GS2.1.s1759896363$o1$g1$t1759896392$j31$l0$h1098222634"

    const { data } = await axios.post(
      'https://turboscribe.ai/_htmx/NCN20gAEkZMBzQPXkQc',
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': COOKIES,
          'Origin': 'https://turboscribe.ai',
          'Referer': 'https://turboscribe.ai/downloader/facebook',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          'X-Lev-Xhr': 'X-Turbolinks-Loaded'
        }
      }
    )

    const $ = cheerio.load(data)
    const thumbnailUrl = $('img.object-cover').attr('src')

    let videoUrl = $('span:contains("HD")').closest('div.block').find('a.dui-btn[href]').attr('href') ||
                   $('span:contains("SD")').closest('div.block').find('a.dui-btn[href]').attr('href')

    if (!videoUrl) throw new Error('Unable to find video download link.')

    return { videoUrl, thumbnailUrl }
  } catch (error) {
    console.error('Error on Turbo Facebook Downloader:', error)
    throw error
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✳️ Example:\n${m.prefix + m.command} https://www.facebook.com/share/r/178yix9Q2T/`)
  
  m.reply("المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy")
  
  try {
    const result = await fbDownloaderTurbo(text)
    await conn.sendFile(m.chat, result.videoUrl, 'fb.mp4', `✅ Download complete!`, m)
  } catch (e) {
    m.reply("❌ Failed to download video, please try another link.")
  }
}

handler.help = handler.command = [ 'fbturbo']
handler.tags = ['downloader']
handler.limit = true

export default handler
