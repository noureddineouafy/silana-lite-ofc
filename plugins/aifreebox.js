/**
 * @instagram.com/noureddine_ouafy
 * @description: Generate images using AIFreeBox
 * @author: SaaOfc's (Modified by Noureddine)
 */

import axios from 'axios'

async function AIFreeboxImage(prompt, aspectRatio = '16:9', slug = 'ai-art-generator') {
  const validRatios = ['1:1', '2:3', '9:16', '16:9']
  const validSlugs = [
    'ai-art-generator',
    'ai-fantasy-map-creator',
    'ai-youtube-thumbnail-generator',
    'ai-old-cartoon-characters-generator'
  ]

  if (!validRatios.includes(aspectRatio)) {
    throw new Error(`❌ Invalid aspect ratio! Choose one of: ${validRatios.join(', ')}`)
  }

  if (!validSlugs.includes(slug)) {
    throw new Error(`❌ Invalid type! Choose one of: ${validSlugs.join(', ')}`)
  }

  try {
    const response = await axios.post('https://aifreebox.com/api/image-generator', {
      userPrompt: prompt,
      aspectRatio,
      slug
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://aifreebox.com',
        'Referer': `https://aifreebox.com/image-generator/${slug}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 Safari/537.36'
      }
    })

    const { data } = response

    if (data?.success && data.imageUrl) {
      return data.imageUrl
    } else {
      throw new Error('❌ No response from API!')
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
    throw new Error('❌ Failed to generate image')
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (args.length < 3) {
    return m.reply(`
❏ *📸 AIFreeBox Image Generator*

💬 Usage:
${usedPrefix + command} [prompt] | [aspect ratio] | [type]

📌 Examples:
${usedPrefix + command} robot cat | 16:9 | ai-art-generator
${usedPrefix + command} kingdom war | 16:9 | ai-fantasy-map-creator

🎨 Available Types:
- ai-art-generator
- ai-fantasy-map-creator
- ai-youtube-thumbnail-generator
- ai-old-cartoon-characters-generator

📐 Available Aspect Ratios:
1:1, 2:3, 9:16, 16:9
`.trim())
  }

  try {
    let [prompt, aspectRatio, slug] = args.join(' ').split('|').map(v => v.trim())

    await m.reply('🔄 Please wait while generating the image...')

    const imageUrl = await AIFreeboxImage(prompt, aspectRatio, slug)

    await conn.sendFile(m.chat, imageUrl, 'aifreebox.jpg', `✅ *Image generated successfully!*\n📌 *Prompt:* ${prompt}`, m)
  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['aifreebox']
handler.tags = ['ai']
handler.command = ['aifreebox']
handler.limit = true

export default handler
