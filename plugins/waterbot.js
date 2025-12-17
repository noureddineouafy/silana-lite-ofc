// scrape by malik
// plugin by instagram.com/noureddine_ouafy
import axios from 'axios'
import https from 'https'
import crypto from 'crypto'

class WaterBot {
  constructor() {
    this.base = 'https://37.187.99.30'
    this.path = '/waterbot/api/v1.0/chat'
    this.agent = new https.Agent({ rejectUnauthorized: false })
  }

  genId() {
    const buf = crypto.randomBytes(12)
    return buf
      .toString('base64')
      .replace(/[+/=]/g, m => (m === '+' ? '-' : m === '/' ? '_' : ''))
      .substring(0, 22)
  }

  async chat({ prompt, sid }) {
    const sessionId = sid || this.genId()
    const url = `${this.base}${this.path}`

    const res = await axios({
      method: 'POST',
      url,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'id-ID',
        'Content-Type': 'application/json',
        'Origin': this.base,
        'Referer': `${this.base}/`,
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Mobile Safari/537.36',
        'X-Session-Id': sessionId
      },
      data: { prompt },
      httpsAgent: this.agent
    })

    return {
      result: res?.data || '',
      sid: sessionId
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.reply(
      m.chat,
      '❌ Please provide a prompt.\n\nExample:\n.waterbot What is artificial intelligence?',
      m
    )
  }

  try {
    const api = new WaterBot()
    const { result } = await api.chat({ prompt: text })

    if (!result) {
      return conn.reply(m.chat, '⚠️ No response received from WaterBot.', m)
    }

    await conn.reply(m.chat, result, m)
  } catch (err) {
    await conn.reply(
      m.chat,
      `❌ Error occurred:\n${err.message || 'Unknown error'}`,
      m
    )
  }
}

handler.help = ['waterbot']
handler.command = ['waterbot']
handler.tags = ['ai']
handler.limit = true

export default handler
