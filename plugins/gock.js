// @instagram: noureddine_ouafy
// 📌 Plugin: Gock Prompt Generator
// scrape by GilangSan
import axios from 'axios'

class Gock {
  constructor() {
    this.base = 'https://ai.gock.net'
    this.headers = {
      'Content-Type': 'application/json',
      Host: 'ai.gock.net',
      Origin: 'https://ai.gock.net',
      Referer: 'https://ai.gock.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
    this.endpoint = {
      prompt: '/api/flux',
      review: '/api/review',
      code: '/api/html-generator',
    }
  }

  async prompt(prompt, type = 'flux', model = 'google:gemini-2.5-flash', number = 3) {
    if (!prompt) return '⚠️ Please provide a prompt!'
    try {
      let { data } = await axios.post(this.base + this.endpoint.prompt, {
        description: prompt,
        options: {
          model: model,
          numberOfPrompts: number
        },
        task: type
      }, { headers: this.headers })

      const prompts = Array.from(data.matchAll(/<prompt>([\s\S]*?)<\/prompt>/g), m => m[1].trim());
      return prompts
    } catch (e) {
      return `❌ Error: ${e.message}`
    }
  }
}

let handler = async (m, { conn, args }) => {
  let text = args.join(" ")
  if (!text) return m.reply("✏️ Please enter a prompt. Example:\n.gock Bird flying over mountain")

  let gock = new Gock()
  let result = await gock.prompt(text)
  if (typeof result === 'string') return m.reply(result)

  let caption = `🌟 *Gock Prompt Generator*\n\n📝 *Input:* ${text}\n\n📌 *Results:*\n`
  caption += result.map((p, i) => `\n${i + 1}. ${p}`).join("\n")

  await m.reply(caption)
}

handler.help = handler.command = ['gock']
handler.tags = ['ai']
handler.limit = true
export default handler
