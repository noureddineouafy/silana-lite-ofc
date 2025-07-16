/*
• Scrape Ask AI
• Author : SaaOfc's
• Edited by: @noureddine_ouafy (IG)
*/

import axios from 'axios'

const models = {
  'ChatGPT-4o': 'chatgpt-4o',
  'ChatGPT-4o Mini': 'chatgpt-4o-mini',
  'Claude 3 Opus': 'claude-3-opus',
  'Claude 3.5 Sonnet': 'claude-3-sonnet',
  'Llama 3': 'llama-3',
  'Llama 3.1 (Pro)': 'llama-3-pro',
  'Perplexity AI': 'perplexity-ai',
  'Mistral Large': 'mistral-large',
  'Gemini 1.5 Pro': 'gemini-1.5-pro'
}

async function askAI(prompt, modelKey) {
  const model = models[modelKey]
  if (!model) return `❌ Model "${modelKey}" غير موجود.`

  try {
    const { data } = await axios.post('https://whatsthebigdata.com/api/ask-ai/', {
      message: prompt,
      model,
      history: []
    }, {
      headers: {
        'content-type': 'application/json',
        'origin': 'https://whatsthebigdata.com',
        'referer': 'https://whatsthebigdata.com/ai-chat/',
        'user-agent': 'Mozilla/5.0'
      }
    })

    if (data?.text) return `🤖 *Model:* ${modelKey}\n🧠 *الجواب:*\n${data.text}`
    return '❌ لم يتم الحصول على رد.'
  } catch (e) {
    return `⚠️ خطأ: ${e.response?.status === 400 ? 'النص مرفوض من طرف النموذج.' : e.message}`
  }
}

let handler = async (m, { conn, args, text }) => {
  if (!text) return m.reply('📝 من فضلك أدخل سؤالك بعد الأمر\nمثال:\n *.ask ما معنى الذكاء الاصطناعي*')

  const modelKey = 'Claude 3.5 Sonnet' // يمكن تغييره أو جعله قابل للتعديل من طرف المستخدم
  const reply = await askAI(text, modelKey)
  m.reply(reply)
}

handler.help = handler.command = ['ask']
handler.tags = ['ai']
handler.limit = true

export default handler
