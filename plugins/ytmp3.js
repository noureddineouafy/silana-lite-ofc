import fetch from 'node-fetch'

const handler = async (m, { conn, command, text }) => {
  if (!text) throw `Use: ${command} <URL>`

  // Show loading reaction
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const api = `https://zenzzapiofficial.vercel.app/downloader/ytmp3?url=${encodeURIComponent(text)}`
    const res = await fetch(api)
    const json = await res.json()

    if (!json.status || !json.result || !json.result.downloadLink) throw 'Failed to get audio. Try again!'

    const {
      title,
      author,
      views,
      lengthSeconds,
      thumbnail,
      videoUrl,
      quality,
      downloadLink
    } = json.result

    // Send the audio file
    await conn.sendMessage(m.chat, {
      audio: { url: downloadLink },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: `Duration: ${lengthSeconds}s | Views: ${views.toLocaleString()} | Quality: ${quality}`,
          thumbnailUrl: thumbnail,
          renderLargerThumbnail: true,
          mediaType: 1,
          mediaUrl: videoUrl,
          sourceUrl: videoUrl
        }
      }
    }, { quoted: m })

    // Show success reaction
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    // Show error reaction
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    throw 'An error occurred. Please try again later!'
  }
}

handler.help = ['ytmp3']
handler.tags = ['downloader']
handler.command = /^(ytmp3)$/i
handler.limit = true
export default handler
