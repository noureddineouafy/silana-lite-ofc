// plugin by Dnn-Cuki
// modified by noureddine ouafy

import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'

let handler = async (m, { text, conn, usedPrefix, command }) => {
  try {
    let [name, comment] = text.split('|')
    if (!name || !comment) throw `Invalid format!\n\nExample: ${usedPrefix + command} noureddine Ouafy|lbot smito silana!`

    let ppUrl = await conn.profilePictureUrl(m.sender, 'image').catch(() => 'https://i.ibb.co/3pPYd14/pp.jpg')
    let pp = await loadImage(ppUrl)

    const canvas = createCanvas(500, 120)
    const ctx = canvas.getContext('2d')

    // Fill background with white
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw profile picture in a circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(30, 30, 20, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(pp, 10, 10, 40, 40)
    ctx.restore()

    // Measure text width for layout
    ctx.font = '13px Arial'
    const nameWidth = ctx.measureText(name.trim()).width

    ctx.font = '12px Arial'
    const commentWidth = ctx.measureText(comment.trim()).width

    const maxWidth = Math.max(nameWidth, commentWidth) + 24

    // Draw the comment bubble
    ctx.fillStyle = '#f0f2f5'
    roundedRect(ctx, 65, 15, maxWidth, 42, 10)
    ctx.fill()

    // Draw name
    ctx.fillStyle = '#050505'
    ctx.font = '13px Arial'
    ctx.fillText(name.trim(), 72, 30)

    // Draw comment
    ctx.fillStyle = '#050505'
    ctx.font = '12px Arial'
    ctx.fillText(comment.trim(), 72, 45)

    // Footer actions (time, like, reply)
    ctx.fillStyle = '#65676b'
    ctx.font = '10px Arial'
    ctx.fillText('2h · Like · Reply · Share', 72, 75)

    const out = canvas.toBuffer()
    fs.writeFileSync('./tmp/fakefb.jpg', out)

    await conn.sendMessage(m.chat, {
      image: out,
      caption: '✅ Fake Facebook comment created successfully!'
    }, { quoted: m })

  } catch (e) {
    if (typeof e === 'string') return m.reply(e)
    console.log(e)
    m.reply(`❌ Error\nError log: ${e.message || e}`)
  }
}

// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

handler.help = ['fakefb']
handler.tags = ['tools']
handler.command = /^fakefb$/i
handler.limit= true
export default handler
