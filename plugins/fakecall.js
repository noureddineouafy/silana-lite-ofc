import { createCanvas, loadImage } from 'canvas'

let handler = async (m, { args, usedPrefix, command }) => {
  // Check if the quoted message contains an image
  if (!m.quoted || !m.quoted.mimetype?.startsWith('image/')) {
    return m.reply(`❌ Reply to the *photo* you want to use!\n\nExample:\n${usedPrefix}fakecall Furina|00:08`)
  }

  // Split input into name and duration
  let [name, duration] = (args.join(' ') || '').split('|')
  if (!name || !duration) return m.reply(`❌ Invalid format!\nExample:\n${usedPrefix}fakecall Furina|00:08`)

  try {
    const qimg = await m.quoted.download()
    const avatar = await loadImage(qimg)
    const bg = await loadImage('https://files.catbox.moe/pmhptv.jpg')

    const canvas = createCanvas(720, 1280)
    const ctx = canvas.getContext('2d')

    // Draw background
    ctx.drawImage(bg, 0, 0, 720, 1280)

    // Draw name
    ctx.font = 'bold 40px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(name.trim(), 360, 150)

    // Draw duration
    ctx.font = '30px sans-serif'
    ctx.fillStyle = '#d1d1d1'
    ctx.fillText(duration.trim(), 360, 200)

    // Draw circular avatar image
    ctx.save()
    ctx.beginPath()
    ctx.arc(360, 635, 160, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avatar, 200, 475, 320, 320)
    ctx.restore()

    const buffer = canvas.toBuffer()
    await conn.sendFile(m.chat, buffer, 'fakecall.jpg', 'Fake call created successfully 📱', m)
  } catch (e) {
    m.reply(`❌ Error\nError log: ${e.message}`)
  }
}

handler.command = ['fakecall']
handler.help = ['fakecall']
handler.tags = ['tools']
handler.limit = true
export default handler
