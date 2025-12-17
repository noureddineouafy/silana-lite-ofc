import https from 'https'

function generateId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function JadveKanjut(message, prompt = 'You are a helpful assistant', options = {}) {
  return new Promise((resolve, reject) => {
    const {
      model = 'gpt-5-mini',
      botId = '',
      chatId = '',
      stream = true,
      returnTokensUsage = true,
      useTools = true
    } = options

    const requestId = generateId(16)

    const postData = JSON.stringify({
      id: requestId,
      messages: [
        {
          role: 'assistant',
          content: [{ type: 'text', text: prompt }]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: message }]
        }
      ],
      model,
      botId,
      chatId,
      stream,
      returnTokensUsage,
      useTools
    })

    const requestOptions = {
      hostname: 'ai-api.jadve.com',
      port: 443,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://jadve.com',
        'Referer': 'https://jadve.com/'
      }
    }

    const req = https.request(requestOptions, res => {
      let buffer = ''
      let fullResponse = ''
      let messageId = ''
      let usage = {}

      res.on('data', chunk => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()

          if (line.startsWith('f:')) {
            messageId = JSON.parse(line.slice(2)).messageId
          } else if (line.startsWith('0:')) {
            fullResponse += JSON.parse(line.slice(2))
          } else if (line.startsWith('e:') || line.startsWith('d:')) {
            const parsed = JSON.parse(line.slice(2))
            if (parsed.usage) usage = parsed.usage
          }
        }

        buffer = lines[lines.length - 1]
      })

      res.on('end', () => {
        resolve({ messageId, response: fullResponse, usage })
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.reply(
      m.chat,
      `❓ *How to use this feature*

Send a message followed by your question.

Example:
.ai Explain what JavaScript is

This command sends your question to an AI assistant and returns the answer.`,
      m
    )
  }

  try {
    await conn.reply(m.chat, '⏳ Thinking, please wait...', m)

    const result = await JadveKanjut(text)

    await conn.reply(
      m.chat,
      `🤖 *AI Response*\n\n${result.response}`,
      m
    )
  } catch (err) {
    await conn.reply(
      m.chat,
      '❌ An error occurred while contacting the AI service.',
      m
    )
  }
}

handler.help = ['ai']
handler.command = ['ai']
handler.tags = ['ai']
handler.limit = true

export default handler
