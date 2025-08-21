/* 
`[pinterest-img]`
type : ESM plugin
API : https://api.siputzx.my.id
plugin modified by noureddine ouafy
*/

import fetch from 'node-fetch'

let handler = async (m, { conn, text, command }) => {
  global.db.data.users = global.db.data.users || {}
  let user = global.db.data.users[m.sender] || {}

  if (command === 'pinterest-img') {
    if (!text) return m.reply(`Please enter a search keyword.\nExample: ${command} nature`)
    user.lastPinterestQuery = text
    global.db.data.users[m.sender] = user
    await sendPinterestImage(m, conn, text)
  }

  if (command === 'again') {
    if (!user.lastPinterestQuery) return m.reply('No previous search keyword found.\nUse first: pinterest-img <keyword>')
    await sendPinterestImage(m, conn, user.lastPinterestQuery)
  }
}

handler.help = ['pinterest-img']
handler.tags = ['downloader']
handler.command = /^pinterest-img$|^again$/i
handler.limit = true

export default handler

async function sendPinterestImage(m, conn, query) {
  try {
    let res = await fetch(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`)
    if (!res.ok) throw await res.text()

    let json = await res.json()
    if (!json.status || !json.data.length) return m.reply('No images found.')

    let result = json.data[Math.floor(Math.random() * json.data.length)]

    let caption = `
📌 *${result.grid_title || 'No Title'}*
📝 ${result.description || '-'}
👤 ${result.pinner.full_name} (@${result.pinner.username})
🔗 ${result.pin}

Type *again* for the next image.
    `.trim()

    await conn.sendFile(m.chat, result.image_url, 'pinterest.jpg', caption, m)

  } catch (e) {
    console.error(e)
    m.reply('Failed to fetch Pinterest data.')
  }
}
