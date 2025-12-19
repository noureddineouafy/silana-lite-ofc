// plugin from my friend adnan thanks 

import { generateWAMessageFromContent } from '@adiwajshing/baileys'

let handler = async (m, { conn, text }) => {
    const userJid = conn.user?.id
    let jid = m.chat

    // If a group JID is provided as text, use it
    if (text && text.endsWith('@g.us')) jid = text

    const groupMetadata = await conn.groupMetadata(jid)

    const album = await generateWAMessageFromContent(
        jid,
        {
            albumMessage: {
                expectedImageCount: 0,
                expectedVideoCount: 0,
                contextInfo: {
                    mentionedJid: groupMetadata.participants.map(p => p.id)
                }
            }
        },
        { userJid }
    )

    await conn.relayMessage(jid, album.message, {
        messageId: album.key.id
    })
}

handler.command = ['ghosttag','hmm']
handler.help = ['ghosttag']
handler.tags = ['owner']
handler.owner = true

export default handler
