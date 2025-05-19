import axios from 'axios'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Please provide a prompt to generate an logos.\nUsage:\n.ai-logo <your prompt here>')

  try {
    const initialPrompt = text.trim()

    const fluxaiUrl = 'https://fluxai.pro/api/prompts/generate'
    const nirkyyUrlBase = 'https://nirkyy.koyeb.app/api/v1/writecream-text2image'

    // طلب توليد نصوص موجهة (prompts) من fluxai
    const fluxaiResponse = await axios.post(fluxaiUrl, {
      prompt: initialPrompt,
      style: 'logo-design'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fluxai.pro/image-prompt-generator'
      },
      responseType: 'text'
    })

    if (fluxaiResponse.status !== 200 || !fluxaiResponse.data) {
      return m.reply('Failed to get prompt ideas from FluxAI. Try again later.')
    }

    const rawTextData = fluxaiResponse.data
    const lines = rawTextData.split('\n').filter(line => line.trim() !== '')
    let promptParts = []

    for (const line of lines) {
      if (line.startsWith('0:')) {
        let contentJsonString = line.substring(2).trim()
        if (contentJsonString.startsWith('"') && contentJsonString.endsWith('"')) {
          try {
            promptParts.push(JSON.parse(contentJsonString))
          } catch {}
        }
      }
    }

    const generatedPrompt = promptParts.join("").trim()

    if (!generatedPrompt) {
      return m.reply('FluxAI returned an unexpected format or no prompt. Cannot continue.')
    }

    // طلب توليد صورة من النيركي
    const encodedPrompt = encodeURIComponent(generatedPrompt)
    const nirkyyImageUrl = `${nirkyyUrlBase}?prompt=${encodedPrompt}&aspect_ratio=1%3A1`

    // إرسال الصورة في المحادثة مع شرح مبسط
    await conn.sendMessage(m.chat, { image: { url: nirkyyImageUrl }, caption: `Generated Image\nOriginal Prompt: ${initialPrompt}\nUsed Prompt: ${generatedPrompt}` }, { quoted: m })

  } catch (e) {
    m.reply('Oops, there was a technical error while generating the image. Please try again later.')
  }
}

handler.help = ['ai-logo']
handler.tags = ['ai']
handler.command = ['ai-logo']
handler.limit = true;
export default handler
