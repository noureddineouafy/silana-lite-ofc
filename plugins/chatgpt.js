// instagram.com/noureddine_ouafy
// scrape by nekolabs
import axios from "axios"

async function chatgpt2022(question, { model = 'gpt-5', reasoning_effort = 'medium' } = {}) {
  try {
    const conf = {
      models: ['gpt-5', 'gpt-3.5'],
      reasoning: ['minimal', 'low', 'medium', 'high']
    }

    if (!question) throw new Error('❌ Question is required')
    if (!conf.models.includes(model)) throw new Error(`✅ Available models: ${conf.models.join(', ')}`)
    if (model === 'gpt-5' && !conf.reasoning.includes(reasoning_effort)) {
      throw new Error(`✅ Available reasoning effort: ${conf.reasoning.join(', ')}`)
    }

    const { data } = await axios.post('https://chatgpt-2022.vercel.app/api/chat', {
      conversationId: Date.now().toString(),
      messages: [{
        role: 'user',
        content: question
      }],
      ...(model === 'gpt-5' ? { reasoningEffort: reasoning_effort } : {}),
      model: model
    }, {
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
      }
    })

    const reasoning = data.split('\n\n')
      .filter(line => line)
      .map(line => JSON.parse(line.substring(6)))
      .filter(line => line.type === 'reasoning-done')?.[0]?.text || ''

    const text = data.split('\n\n')
      .filter(line => line)
      .map(line => JSON.parse(line.substring(6)))
      .filter(line => line.type === 'text-delta')
      .map(line => line.textDelta)
      .join('') || ''

    return { reasoning, text }

  } catch (error) {
    throw new Error(String(error))
  }
}

// ===== Plugin Handler =====
let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) throw `❌ Please provide a question.\n\n📌 Example: *${usedPrefix + command} What is AI?*`

    let resp = await chatgpt2022(text, { model: 'gpt-5' })
    let replyMsg = resp.text || "❌ No response received."

    await conn.reply(m.chat, replyMsg, m)

  } catch (e) {
    await conn.reply(m.chat, `⚠️ Error: ${String(e)}`, m)
  }
}

handler.help = ['chatgpt']
handler.command = ['chatgpt']
handler.tags = ['ai']
handler.limit = true

export default handler
