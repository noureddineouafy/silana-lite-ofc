import axios from 'axios'
import cheerio from 'cheerio'

function extractUrl(url) {
  if (!url || typeof url !== 'string') return null

  let match = url.match(/\/(hd|dl|mp3)\/([A-Za-z0-9+/=]+)/)
  if (match && match[2]) {
    try {
      return Buffer.from(match[2], 'base64').toString('utf-8')
    } catch {
      return null
    }
  }
  return url
}

async function musicaldown(url) {
  const cfg = {
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
    }
  }

  try {
    let res = await axios.get('https://musicaldown.com/id/download', cfg)

    const cookies = res.headers['set-cookie']
      ? res.headers['set-cookie'].join('; ')
      : ''

    const $initial = cheerio.load(res.data)
    const url_name = $initial('#link_url').attr('name')

    if (!url_name) {
      throw new Error('Failed to get form field')
    }

    const token = $initial(
      '#submit-form input[type=hidden]:nth-child(2)'
    )
    const verify = $initial(
      '#submit-form input[type=hidden]:nth-child(3)'
    )

    let data = {
      [url_name]: url,
      [token.attr('name')]: token.attr('value'),
      verify: verify.attr('value')
    }

    let pageDl = await axios.post(
      'https://musicaldown.com/id/download',
      new URLSearchParams(data),
      {
        headers: {
          ...cfg.headers,
          cookie: cookies
        }
      }
    )

    const $dl = cheerio.load(pageDl.data)
    let isSlide = $dl('div.card-image')

    if (isSlide.length === 0) {
      const video = extractUrl(
        $dl('a[data-event="mp4_download_click"]').attr('href')
      )
      const video_hd = extractUrl(
        $dl('a[data-event="hd_download_click"]').attr('href')
      )
      const video_wm = extractUrl(
        $dl('a[data-event="watermark_download_click"]').attr('href')
      )

      let getPageMusic = await axios.post(
        'https://musicaldown.com/id/mp3',
        '',
        {
          headers: {
            ...cfg.headers,
            cookie: cookies
          }
        }
      )

      const $music = cheerio.load(getPageMusic.data)
      const audio = $music(
        'a[data-event="mp3_download_dclick"]'
      ).attr('href')

      if (!video && !video_hd) {
        throw new Error('Video link not found')
      }

      return {
        status: true,
        type: 'video',
        video,
        video_hd,
        video_wm,
        audio
      }
    } else {
      let image = []

      isSlide.each((_, e) => {
        const img = $dl(e).find('img').attr('src')
        if (img) image.push(img)
      })

      const audio = extractUrl(
        $dl('a[data-event="mp3_download_click"]').attr('href')
      )

      const tokenMatch = pageDl.data.match(/ data: '(.*?)'/)
      const getToken = tokenMatch ? tokenMatch[1] : null

      let vidSlide = null
      if (getToken) {
        vidSlide = await axios.post(
          'https://mddown.xyz/slider',
          new URLSearchParams({ data: getToken }),
          cfg
        )
      }

      return {
        status: true,
        type: 'slide',
        image,
        video: vidSlide?.data?.url || null,
        audio
      }
    }
  } catch (e) {
    return {
      status: false,
      message: `Download failed: ${e.message}`
    }
  }
}

async function handler(m, { conn, args }) {
  if (!args[0]) {
    return m.reply('Please provide a TikTok link')
  }

  m.reply('Please wait...')

  try {
    const result = await musicaldown(args[0])

    if (!result.status) {
      return m.reply(result.message)
    }

    if (result.type === 'video') {
      const videoUrl = result.video_hd || result.video
      if (!videoUrl) return m.reply('Video not found')

      await conn.sendMessage(m.chat, {
        video: { url: videoUrl }
      })

      if (result.audio) {
        await conn.sendMessage(m.chat, {
          audio: { url: result.audio },
          mimetype: 'audio/mp4'
        })
      }
    } else if (result.type === 'slide') {
      for (let img of result.image) {
        if (!img) continue
        await conn.sendMessage(m.chat, {
          image: { url: img }
        })
      }

      if (result.audio) {
        await conn.sendMessage(m.chat, {
          audio: { url: result.audio },
          mimetype: 'audio/mp4'
        })
      }
    }
  } catch (e) {
    m.reply('Error occurred: ' + e.message)
  }
}

handler.help = ['tiktokdown']
handler.tags = ['downloader']
handler.command = ['tiktokdown']
handler.limit = true

export default handler
