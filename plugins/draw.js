// @noureddine_ouafy
// api NirKyy
// Command: .draw
// Usage: .draw <prompt> | [aspect_ratio (optional, default 1:1)]
// Example: .draw a beautiful sunset | 16:9
// Description: Generates an AI image from a prompt with optional aspect ratio.

import axios from 'axios'

let handler = async (m, { text }) => {
  if (!text) throw 'Please provide a prompt. Usage:\n.draw prompt | aspect_ratio(optional)'

  // تقسيم النص إلى prompt و aspect_ratio
  const [prompt, aspectRatio = '1:1'] = text.split('|').map(s => s.trim())

  if (!prompt) throw 'Prompt is required!'

  const link = 'writecream.com'

  const apiUrl = `https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}&link=${encodeURIComponent(link)}`

  try {
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
        'Referer': apiUrl
      }
    })

    const imageLink = apiResponse.data.image_link
    if (!imageLink) throw 'No image link received from API.'

    // إرسال الصورة عبر الرابط للمستخدم
    await conn.sendMessage(m.chat, { image: { url: imageLink }, caption: `Prompt: ${prompt}\nAspect Ratio: ${aspectRatio}` }, { quoted: m })

  } catch (e) {
    if (e.response && e.response.status) {
      if (e.response.status >= 400 && e.response.status < 500) {
        throw `API error, status ${e.response.status}. Check your prompt or parameters.`
      } else {
        throw `Server error, status ${e.response.status}. Try again later.`
      }
    } else if (e.request) {
      throw 'Failed to connect to API. Check your internet connection.'
    } else {
      throw 'Unexpected error occurred while fetching the image.'
    }
  }
}

handler.help = ['draw']
handler.tags = ['ai']
handler.command = ['draw']
handler.limit = true;
export default handler
