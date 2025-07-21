/*
* Feature Name : Image Tools
* Type         : Plugin Esm
* Source       : https://whatsapp.com/channel/0029Vb6Zs8yEgGfRQWWWp639
* Script Source: https://whatsapp.com/channel/0029VbANq6v0VycMue9vPs3u
* Author       : ZenzzXD
*/

import axios from 'axios'
import cheerio from 'cheerio'
import FormData from 'form-data'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const _type = ['removebg', 'enhance', 'upscale', 'restore', 'colorize']

    if (!text) {
        throw `🧰 Available Image Tools:\n\n> removebg\n> enhance\n> upscale\n> restore\n> colorize\n\n📥 Example usage:\n${usedPrefix + command} removebg`
    }

    if (!_type.includes(text)) {
        throw `❌ Invalid tool type.\n\n🧰 Available tools:\n> ${_type.join('\n> ')}`
    }

    let buffer
    if (m.quoted && m.quoted.mimetype?.includes('image')) {
        buffer = await m.quoted.download()
    } else if (m.mimetype?.includes('image')) {
        buffer = await m.download()
    } else {
        throw `🖼️ Please reply to an image with caption: ${usedPrefix + command} ${text}`
    }

    m.reply('⏳ Please wait, processing your image...')

    try {
        const form = new FormData()
        form.append('file', buffer, `${Date.now()}.jpg`)
        form.append('type', text)

        const res = await axios.post('https://imagetools.rapikzyeah.biz.id/upload', form, {
            headers: form.getHeaders()
        })

        const $ = cheerio.load(res.data)
        const resultUrl = $('img#memeImage').attr('src')

        if (!resultUrl) throw new Error('No result found.')

        await conn.sendFile(m.chat, resultUrl, 'result.jpg', '', m)
    } catch (e) {
        throw `❌ Error: ${e.message}`
    }
}

handler.help = ['imgtools']
handler.tags = ['tools']
handler.command = ['imgtools']
handler.limit = true
export default handler
