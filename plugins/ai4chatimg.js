import axios from 'axios'

/**
 * Calls the ai4chat API to generate an image.
 * @param {string} prompt The text prompt for the image.
 * @param {string} [ratio='1:1'] The aspect ratio of the image.
 * @returns {Promise<string>} The URL of the generated image.
 */
async function ai4chat(prompt, ratio = '1:1') {
    const validRatios = ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16', '21:9', '9:21']
    
    if (!prompt) throw new Error('Prompt is required')
    if (!validRatios.includes(ratio)) throw new Error(`Invalid ratio. Available ratios: ${validRatios.join(', ')}`)
    
    const { data } = await axios.get('https://www.ai4chat.co/api/image/generate', {
        params: {
            prompt: prompt,
            aspect_ratio: ratio
        },
        headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'referer': 'https://www.ai4chat.co/image-pages/realistic-ai-image-generator',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    })
    
    return data.image_link
}

// Bot command handler
let handler = async (m, { conn, args }) => {
    try {
        // Show help message if no prompt is provided
        if (!args[0]) {
            return m.reply(`*To generate an image, use the command as follows:*
  
*Command:* \`.ai4chatimg [prompt],[ratio]\`
  
*Examples:*
• \`.ai4chatimg a girl wearing glasses\`
• \`.ai4chatimg a beautiful landscape,16:9\`
• \`.ai4chatimg an anime character,2:3\`

*Available Ratios:*
• *1:1* - Square
• *16:9* - Widescreen
• *2:3* - Portrait
• *3:2* - Landscape
• *4:5* - Portrait (Instagram)
• *5:4* - Landscape (Instagram)
• *9:16* - Vertical/Story
• *21:9* - Ultra-Wide
• *9:21* - Ultra-Tall`)
        }

        // Parse prompt and ratio from arguments
        const input = args.join(' ').split(',')
        const prompt = input[0].trim()
        const ratio = input[1] ? input[1].trim() : '1:1'

        const validRatios = ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16', '21:9', '9:21']

        // Validate the ratio and provide a user-friendly error message
        if (!validRatios.includes(ratio)) {
            return m.reply(`Ratio \`${ratio}\` is invalid!

*Available Ratios:*
• *1:1* - Square
• *16:9* - Widescreen
• *2:3* - Portrait
• *3:2* - Landscape
• *4:5* - Portrait (Instagram)
• *5:4* - Landscape (Instagram)
• *9:16* - Vertical/Story
• *21:9* - Ultra-Wide
• *9:21* - Ultra-Tall

*Example:* \`.ai4chatimg ${prompt},16:9\``)
        }

        // Inform the user that the image is being generated
        await m.reply('Generating image, please wait...')

        // Call the API function to get the image URL
        const imageUrl = await ai4chat(prompt, ratio)

        // Send the generated image with a caption
        await conn.sendMessage(m.chat, { 
            image: { url: imageUrl },
            caption: `*Prompt:* ${prompt}\n*Ratio:* ${ratio}`
        }, { quoted: m })

    } catch (e) {
        // Reply with any error message
        m.reply(`An error occurred:\n${e.message}`)
    }
}

// Command configuration
handler.help = ['ai4chatimg']
handler.command = ['ai4chatimg']
handler.tags = ['ai']
handler.limit = true // Assumes a rate-limiting middleware

export default handler
