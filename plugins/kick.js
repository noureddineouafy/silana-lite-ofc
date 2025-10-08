let handler = async (m, { conn, text, participants }) => {
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? (text.replace(/\D/g, '') + '@s.whatsapp.net') : ''
    if (!who || who == m.sender) throw 'Reply/tag member'
    if (participants.filter(v => v.jid == who).length == 0) throw `The target not in this group!`
    conn.groupParticipantsUpdate(m.chat, [who], 'remove')
        .then(_ => m.reply(`Success`))
}

handler.help = ['kick']
handler.tags = ['owner']
handler.command = /^(kick)$/i

handler.owner = true 
handler.group = true
handler.botAdmin = true
handler.admin = true

export default handler
