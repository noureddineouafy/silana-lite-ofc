import CryptoJS from 'crypto-js'

// MP3 Downloader Utility
const mp3dl = {
  // Function to generate a secure token
  generateToken: () => {
    let payload = JSON.stringify({ timestamp: Date.now() })
    let key = 'dyhQjAtqAyTIf3PdsKcJ6nMX1suz8ksZ'
    return CryptoJS.AES.encrypt(payload, key).toString()
  },

  // Function to download audio from YouTube
  download: async youtubeUrl => {
    let json = await fetch('https://ds1.ezsrv.net/api/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: youtubeUrl,
        quality: 128, // Audio quality in kbps
        trim: false,  // No trimming
        startT: 0,    // Start time
        endT: 0,      // End time
        token: mp3dl.generateToken()
      })
    }).then(res => res.json())
    return json
  }
}

let handler = async (m, { conn, args }) => {
  try {
    if (!args[0]) {
      return m.reply(
        'Please provide a YouTube link.\n\n*Example:* .yta https://youtube.com/watch?v=7xo0Lubd3-U'
      )
    }

    let { url, title, status } = await mp3dl.download(args[0])

    await conn.sendMessage(
      m.chat,
      {
        document: { url },
        fileName: `${title}.mp3`,
        mimetype: 'audio/mpeg'
      },
      { quoted: m }
    )

  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['yta']
handler.command = ['yta']
handler.tags = ['downloader']
handler.limit = true
export default handler
