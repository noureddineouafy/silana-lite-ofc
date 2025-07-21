// Instagram: noureddine_ouafy
// scrape by haan
import axios from 'axios'

function ytid(url) {
  let ID = ''
  url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
  if (url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_\-]/i)
    ID = ID[0]
  } else {
    ID = url
  }
  return ID
}

async function ytdl(videoId, targetQuality = 320) {
  try {
    const response = await axios.get('https://c01-h01.cdnframe.com/api/v4/info/' + videoId)
    const data = response.data

    const audioFormats = data.formats?.audio?.mp3 || []
    const selected = audioFormats.find(format => format.quality === targetQuality)

    if (!selected) {
      return { error: `❌ لم يتم العثور على الجودة المطلوبة: ${targetQuality}` }
    }

    const convertResponse = await axios.post('https://c01-h01.cdnframe.com/api/v4/convert', {
      token: selected.token
    })

    const convertData = convertResponse.data

    if (!convertData.id) {
      return { error: "❌ لم يتم الحصول على المعرف للتحويل." }
    }

    const statusResponse = await axios.get('https://c01-h01.cdnframe.com/api/v4/status/' + convertData.id)
    const statusData = statusResponse.data

    return {
      title: data.title,
      quality: targetQuality,
      downloadUrl: statusData.download || null,
    }

  } catch (error) {
    return { error: error.message }
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let url = args[0]
  if (!url) return m.reply(`📌 من فضلك أرسل رابط اليوتيوب.\n\n📥 مثال:\n${usedPrefix + command} https://youtube.com/watch?v=7xo0Lubd3-U`)
  
  let id = ytid(url)
  let result = await ytdl(id, 128)

  if (result.error) return m.reply(`❌ خطأ: ${result.error}`)
  if (!result.downloadUrl) return m.reply(`❌ لم يتم العثور على رابط التحميل.`)

  await conn.sendMessage(m.chat, {
    audio: { url: result.downloadUrl.toString() },
    mimetype: 'audio/mp4',
    ptt: false
  }, { quoted: m })
}

handler.help = ['yta']
handler.tags = ['downloader']
handler.command = ['yta']
handler.limit = true

export default handler
