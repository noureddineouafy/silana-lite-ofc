// plugin by my friend Const Offmon = Lana
// modify by instagram.com/noureddine_ouafy

import moment from 'moment-timezone'
import { toPTT } from '../lib/converter.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  let channelId = "120363285847738492@newsletter" // Your updated channel ID
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''

  if (/audio/.test(mime)) {

    if (!text) throw `Example: ${usedPrefix + command} DJ missing you`

    let ppUrl = await conn.profilePictureUrl(conn.user.jid, 'image')
      .catch(() => "https://telegra.ph/file/1dff1788814dd281170f8.jpg")

    let date = moment().tz('Asia/Jakarta').locale('id').format('dddd, D MMMM YYYY')
    let time = moment().tz('Asia/Jakarta').locale('id').format('HH:mm:ss')

    let buffer = await q.download()
    let media = await toPTT(buffer, 'mp3')

    await conn.sendMessage(channelId, {
      audio: media.data,
      mimetype: 'audio/mp4',
      ptt: true,
      contextInfo: {
        externalAdReply: {
          title: text,
          body: "#1 bot in middle east | سيلانا بوت",
          thumbnailUrl: ppUrl,
          mediaType: 1,
          renderLargerThumbnail: false
        },
      },
    })

    await m.reply("Audio successfully sent to channel")

  } else throw `Reply to an audio with the command ${usedPrefix + command}`
}

handler.command = ['playch']
handler.tags = ['owner']
handler.help = ['playch']
handler.owner = true

export default handler
