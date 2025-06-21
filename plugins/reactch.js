/*

# Feature : reactch
# Type : ESM Plugin
# Created by : https://whatsapp.com/channel/0029Vb2qri6JkK72MIrI8F1Z
# API : conn.newsletterReactMessage

   ⚠️ _Note_ ⚠️
Don't remove this watermark brooo

*/

const font2 = {
  a: '🄰', b: '🄱', c: '🄲', d: '🄳', e: '🄴', f: '🄵', g: '🄶',
  h: '🄷', i: '🄸', j: '🄹', k: '🄺', l: '🄻', m: '🄼', n: '🄽',
  o: '🄾', p: '🄿', q: '🅀', r: '🅁', s: '🅂', t: '🅃', u: '🅄',
  v: '🅅', w: '🅆', x: '🅇', y: '🅈', z: '🅉'
}

const handler = async (m, { conn, text }) => {
  if (!text.includes('|')) {
    return m.reply(`Incorrect format. Example:\n.reactch https://whatsapp.com/channel/abc/123|hello world`)
  }

  let [link, ...messageParts] = text.split('|')
  link = link.trim()
  const msg = messageParts.join('|').trim().toLowerCase()

  if (!link.startsWith("https://whatsapp.com/channel/")) {
    return m.reply("Invalid link. It must start with https://whatsapp.com/channel/")
  }

  const emoji = msg.split('').map(c => c === ' ' ? '―' : (font2[c] || c)).join('')

  try {
    const [, , , , channelId, messageId] = link.split('/')
    const res = await conn.newsletterMetadata("invite", channelId)
    await conn.newsletterReactMessage(res.id, messageId, emoji)
    m.reply(`✅ Reaction *${emoji}* successfully sent to channel *${res.name}*.`)
  } catch (e) {
    console.error(e)
    m.reply("❌ Error\nFailed to send reaction. Check the link or your connection!")
  }
}

handler.command = ['reactch', 'rch']
handler.tags = ['owner']
handler.help = ['reactch']
handler.owner = true
export default handler
