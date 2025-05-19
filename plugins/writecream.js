// @noureddine_ouafy
// Command: .writecream
// Usage: .writecream system message|user message
// Example: .writecream You are a helpful assistant.|What is the capital of Morocco?
// Description: Sends a prompt to Writecream AI and replies with the generated response.
import fetch from 'node-fetch'

let handler = async (m, { text }) => {
  if (!text) throw 'Please provide input in the format: system message|user message'

  const [system, query] = text.split('|').map(s => s.trim())
  if (!system || !query) throw 'Missing system or query! Format: system|query'

  const queryParam = JSON.stringify([
    { role: 'system', content: system },
    { role: 'user', content: query }
  ])
  const encodedQueryParam = encodeURIComponent(queryParam)

  const url = `https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat?query=${encodedQueryParam}&link=writecream.com`

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
    'Referer': 'https://www.writecream.com/ai-chat/'
  }

  try {
    const res = await fetch(url, { headers })
    const json = await res.json()

    if (json && json.response_content) {
      await m.reply(json.response_content)
    } else {
      throw 'Unexpected response format!'
    }
  } catch (e) {
    throw 'Failed to fetch response.'
  }
}

handler.help = handler.command = ['writecream']
handler.tags = ['ai']
handler.limit = true;
export default handler
