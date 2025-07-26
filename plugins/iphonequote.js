// @noureddine_ouafy
// Feature: iPhone Quoted Chat Generator
// Source: https://whatsapp.com/channel/0029Vb6Zs8yEgGfRQWWWp639
// Author: ZenzzXD (modified to ESM and English by Noureddine)

import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`📌 Usage:\n.iphonequote time|battery|message\n\nExample:\n.iphonequote 18:00|40|Hello, how are you?`)

  let [time, battery, ...msg] = text.split('|')
  if (!time || !battery || msg.length === 0) {
    return m.reply(`❌ Incorrect format.\n\n✅ Correct usage:\n.iphonequote time|battery|message\n\n🧪 Example:\n.iphonequote 18:00|80|Hey! What's up?`)
  }

  await m.reply('⏳ Generating iPhone-style message...')

  const messageText = encodeURIComponent(msg.join('|').trim())
  const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&batteryPercentage=${battery}&carrierName=ORANGE&messageText=${messageText}&emojiStyle=apple`

  const res = await fetch(url)
  if (!res.ok) throw '❌ Failed to fetch the image from server.'

  const buffer = await res.buffer()
  await conn.sendMessage(m.chat, { image: buffer }, { quoted: m })
}

handler.help = ['iphonequote']
handler.tags = ['tools']
handler.command = ['iphonequote']
handler.limit = true

export default handler
