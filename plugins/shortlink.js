// @noureddine_ouafy

import axios from 'axios'

let handler = async (m, { args }) => {
  try {
    if (!args[0]) return m.reply('Please provide a link to shorten.')

    let { shortUrl } = (await axios.post('https://short.abella.icu/api/shorten', { url: args[0] }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://short.abella.icu/'
      },
      compress: true
    })).data

    m.reply(shortUrl)
  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['shortlink']
handler.command = ['shortlink']
handler.tags = ['tools']
handler.limit = true

export default handler
