/*

Feature : ytmp3
Type : Plugins ESM
Created by : https://whatsapp.com/channel/0029VbBbGUiFcow4neaist0T
Api : sankavollerei.com

⚠️ Note ⚠️ jangan hapus wm ini banggg

*/

import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!args[0]) return m.reply(`Usage: ${usedPrefix + command} <url>`)

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    let url = `https://www.sankavollerei.com/download/ytmp3?apikey=planaai&url=${encodeURIComponent(args[0])}`
    let res = await axios.get(url)
    let json = res.data

    if (!json.status) return m.reply(`❌ Failed to fetch data from API`)

    let { title, thumbnail, download, duration } = json.result

    await conn.sendMessage(m.chat, {
      audio: { url: download },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
    }, { quoted: m })

  } catch (err) {
    m.reply(`❌ Error\nError logs : ${err.message}`)
  }
}

handler.help = ['yta'];
handler.tags = ['downloader'];
handler.command = /^yta$/i;

export default handler
