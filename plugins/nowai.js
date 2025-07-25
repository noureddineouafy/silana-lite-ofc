// @noureddine_ouafy
// scrape by Author: Shannz
import crypto from 'crypto'
import axios from 'axios'

const nowtech = {
  chat: async (question) => {
    const timestamp = Date.now().toString()
    const secretKey = 'dfaugf098ad0g98-idfaugf098ad0g98-iduoafiunoa-f09a8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8gduoafiunoa-f09adfaugf098ad0g98-iduoafiunoa-f09a8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8g8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8g'
    const key = crypto.createHmac('sha512', secretKey).update(timestamp).digest('base64')
    const data = JSON.stringify({ content: question })

    const config = {
      method: 'POST',
      url: 'http://aichat.nowtechai.com/now/v1/ai',
      headers: {
        'User-Agent': 'Ktor client',
        'Connection': 'Keep-Alive',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
        'Key': key,
        'TimeStamps': timestamp,
        'Accept-Charset': 'UTF-8'
      },
      data: data,
      responseType: 'stream'
    }

    return new Promise((resolve, reject) => {
      axios.request(config).then((response) => {
        let result = ''

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.replace('data: ', ''))
                const content = json?.choices?.[0]?.delta?.content
                if (content) result += content
              } catch (err) {
                console.error('Parsing error:', err.message)
              }
            }
          }
        })

        response.data.on('end', () => {
          resolve(result.trim())
        })

        response.data.on('error', (err) => {
          reject(err)
        })
      }).catch((err) => reject(err))
    })
  },

  art: async (prompt) => {
    const config = {
      method: 'GET',
      url: `http://art.nowtechai.com/art?name=${encodeURIComponent(prompt)}`,
      headers: {
        'User-Agent': 'okhttp/5.0.0-alpha.9',
        'Connection': 'Keep-Alive',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    }

    const response = await axios.request(config)
    return response.data
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`✳️ Please enter a question\n\nExample:\n${usedPrefix + command} What is AI?`)
  }

  m.reply('⌛ Please wait while I think...')
  try {
    const reply = await nowtech.chat(args.join(' '))
    m.reply(reply || '❌ No response received.')
  } catch (err) {
    console.error(err)
    m.reply('❌ Error occurred while processing your question.')
  }
}

handler.help = ['nowai']
handler.tags = ['ai']
handler.command = ['nowai']
handler.limit = true

export default handler
