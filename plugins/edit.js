// plugin by noureddine ouafy
// scrape NekoLabs Builds

import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'

async function nanobanana(prompt, image) {
    try {
        if (!prompt) throw new Error('Prompt is required.')
        if (!Buffer.isBuffer(image)) throw new Error('Image must be a buffer.')
        
        const inst = axios.create({
            baseURL: 'https://image-editor.org/api',
            headers: {
                origin: 'https://image-editor.org',
                referer: 'https://image-editor.org/editor',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        })
        
        const { data: up } = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_rynn.jpg`,
            contentType: 'image/jpeg'
        })
        
        if (!up?.data?.uploadUrl) throw new Error('Upload url not found.')
        await axios.put(up.data.uploadUrl, image)
        
        const { data: cf } = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://image-editor.org/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        })
        
        if (!cf?.result) throw new Error('Failed to get cf token.')
        
        const { data: task } = await inst.post('/edit', {
            prompt,
            image_urls: [up.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.result,
            uploadIds: [up.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(image).digest('hex').substring(0, 64)
        })
        
        if (!task?.data?.taskId) throw new Error('Task id not found.')
        
        while (true) {
            const { data } = await inst.get(`/task/${task.data.taskId}`)
            if (data?.data?.status === 'completed') return data.data.result
            await new Promise(res => setTimeout(res, 1000))
        }
    } catch (error) {
        throw new Error(error.message)
    }
}


let handler = async (m, { conn, text }) => {
    try {
        if (!text) return m.reply('❗ Please provide a prompt.\nExample: `.edit change skin color to black`')

        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''

        if (!mime || !mime.startsWith('image/'))
            return m.reply('❗ Please reply to an image.')

        let img = await q.download()
        if (!img) return m.reply('Failed to download the image.')

        m.reply('⏳ Processing your image...')

        let resultUrl = await nanobanana(text, img)

        await conn.sendMessage(m.chat, { image: { url: resultUrl }, caption: '✅ Done!' }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error: ' + e.message)
    }
}

handler.help = handler.command = ['edit']
handler.tags = ['ai']
handler.limit = true

export default handler
