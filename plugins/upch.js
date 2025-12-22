/**
⧉ feature : [upch]
⧉ source  : [https://whatsapp.com/channel/0029Vb67i65Fi8xX7rOtIc2S]
⧉ creator : [Hanz]
**/

import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        throw `Example:\n${usedPrefix + command} Hello world`
    }

    const idch = '120363285847738492@newsletter'
    const thumbUrl = 'https://files.catbox.moe/gavnyp.jpg'

    let thumbnail = await fetch(thumbUrl)
        .then(res => res.buffer())
        .catch(() => null)

    await conn.sendMessage(m.chat, {
        react: { text: '😒', key: m.key }
    })

    let content = {
        text: text,
        contextInfo: {
            externalAdReply: {
                title: 'SILANA - AI | سيلانا بوت',
                body: 'https://instagram.com/noureddine_ouafy',
                thumbnail: thumbnail,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false
            }
        }
    }

    await conn.sendMessage(idch, content)

    await conn.sendMessage(m.chat, {
        react: { text: '✅', key: m.key }
    })

    m.reply('✅ Done. If you keep asking, that’s outside the system.')
}

handler.command = /^(upch)$/i
handler.help = ['upch']
handler.tags = ['owner']
handler.mods = true

export default handler
