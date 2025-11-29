// plugin by instagram.com/noureddine_ouafy
// scrape by NekoLabs Builds

import axios from 'axios'
import crypto from 'crypto'

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!mime || !/image/.test(mime)) {
        return m.reply(`⚠️ Reply to *an image* with:\n${usedPrefix + command} <prompt>`)
    }

    if (!m.text) return m.reply(`Example:\n${usedPrefix + command} change the hair color to black`)

    let prompt = m.text.trim()

    try {
        let image = await q.download()

        if (!image) return m.reply('❌ Failed to download the image.')

        m.reply('⏳ Processing your image, please wait...')

        let result = await nanobanana(prompt, image)

        await conn.sendFile(m.chat, result, 'edited.jpg', `✅ Done!\nPrompt: ${prompt}`, m)

    } catch (e) {
        console.error(e)
        m.reply('❌ Error: ' + e.message)
    }
}

handler.help = handler.command = ['nanobananapro']
handler.tags = ['ai']
handler.limit = true

export default handler


/* ───────── FUNCTION ───────── */

async function nanobanana(prompt, image) {
    try {
        if (!prompt) throw new Error('Prompt is required.')
        if (!Buffer.isBuffer(image)) throw new Error('Image must be a buffer.')

        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                origin: 'https://nanobananas.pro',
                referer: 'https://nanobananas.pro/editor',
                'user-agent':
                    'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        })

        const { data: up } = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_rynn.jpg`,
            contentType: 'image/jpeg'
        })

        if (!up?.data?.uploadUrl) throw new Error('Upload URL not found.')

        await axios.put(up.data.uploadUrl, image)

        const { data: cf } = await axios.post(
            'https://api.nekolabs.web.id/tools/bypass/cf-turnstile',
            {
                url: 'https://nanobananas.pro/editor',
                siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
            }
        )

        if (!cf?.result) throw new Error('Failed to get CF token.')

        const { data: task } = await inst.post('/edit', {
            prompt: prompt,
            image_urls: [up.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.result,
            uploadIds: [up.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(image).digest('hex').substring(0, 64)
        })

        if (!task?.data?.taskId) throw new Error('Task ID not found.')

        while (true) {
            const { data } = await inst.get(`/task/${task.data.taskId}`)
            if (data?.data?.status === 'completed') return data.data.result

            await new Promise(res => setTimeout(res, 1000))
        }

    } catch (error) {
        throw new Error(error.message)
    }
}
