// ============================================================
//  📖  SEERAH — Biography of the Prophet ﷺ by Nabil Al-Awadi
//  Command : .seerah  |  .seerah <episode number>
//  Tags    : islamic
// plugin by noureddine Ouafy 
// ============================================================

const EPISODES = [
  { ep: 1,  size: '13.2M', url: 'https://ia800809.us.archive.org/14/items/seera_nabawiya_al3awadi/seera01.mp3' },
  { ep: 2,  size: '14.3M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera02.mp3' },
  { ep: 3,  size: '13.4M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera03.mp3' },
  { ep: 4,  size: '12.8M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera04.mp3' },
  { ep: 5,  size: '12.8M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera05.mp3' },
  { ep: 6,  size: '12.6M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera06.mp3' },
  { ep: 7,  size: '13.6M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera07.mp3' },
  { ep: 8,  size: '13.4M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera08.mp3' },
  { ep: 9,  size: '12.7M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera09.mp3' },
  { ep: 10, size: '14.6M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera10.mp3' },
  { ep: 11, size: '13.7M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera11.mp3' },
  { ep: 12, size: '12.9M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera12.mp3' },
  { ep: 13, size: '14.6M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera13.mp3' },
  { ep: 14, size: '13.8M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera14.mp3' },
  { ep: 15, size: '15.7M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera15.mp3' },
  { ep: 16, size: '14.5M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera16.mp3' },
  { ep: 17, size: '14.2M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera17.mp3' },
  { ep: 18, size: '12.9M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera18.mp3' },
  { ep: 19, size: '13.9M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera19.mp3' },
  { ep: 20, size: '15.3M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera20.mp3' },
  { ep: 21, size: '16.0M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera21.mp3' },
  { ep: 22, size: '15.5M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera22.mp3' },
  { ep: 23, size: '13.5M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera23.mp3' },
  { ep: 24, size: '14.5M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera24.mp3' },
  { ep: 25, size: '14.3M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera25.mp3' },
  { ep: 26, size: '13.9M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera26.mp3' },
  { ep: 27, size: '14.2M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera27.mp3' },
  { ep: 28, size: '13.2M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera28.mp3' },
  { ep: 29, size: '15.7M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera29.mp3' },
  { ep: 30, size: '13.8M', url: 'https://archive.org/download/seera_nabawiya_al3awadi/seera30.mp3' },
]

// ─── Guide message shown when no episode number is provided ───────────────────
function buildGuide() {
  const episodeList = EPISODES.map(e =>
    `  📌 Episode ${String(e.ep).padStart(2, '0')} — ${e.size}`
  ).join('\n')

  return `
╔══════════════════════════════════╗
║  📖  Seerah — The Prophet's ﷺ   ║
║        Biography Series          ║
╚══════════════════════════════════╝

🎙️ *Presented by:* Sheikh Nabil Al-Awadi
📦 *Total Episodes:* ${EPISODES.length} episodes
🗂️ *Format:* MP3 Audio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *AVAILABLE EPISODES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${episodeList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *HOW TO USE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To get a specific episode, type:

  *.seerah <episode number>*

  Example → *.seerah 1*
  Example → *.seerah 15*

The bot will send you a direct
download link for that episode! 🎧

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕌 *About This Series*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a complete audio series on
the life of Prophet Muhammad ﷺ,
narrated by the renowned Islamic
scholar Sheikh Nabil Al-Awadi.

Listening to the Seerah deepens
your love for the Prophet ﷺ and
strengthens your character.

May Allah bless you 🤲
`.trim()
}

// ─── Handler ──────────────────────────────────────────────────────────────────
let handler = async (m, { conn, args }) => {

  // If the user typed a number, send that episode
  if (args[0]) {
    const num = parseInt(args[0])

    // Validate the number
    if (isNaN(num) || num < 1 || num > EPISODES.length) {
      await conn.sendMessage(
        m.chat,
        {
          text:
            `❌ *Invalid episode number!*\n\n` +
            `Please enter a number between *1* and *${EPISODES.length}*.\n\n` +
            `Example: *.seerah 5*`
        },
        { quoted: m }
      )
      return
    }

    const episode = EPISODES.find(e => e.ep === num)

    // 1️⃣ Send a quick info message first
    await conn.sendMessage(
      m.chat,
      {
        text:
          `⏳ *Loading Episode ${episode.ep} of ${EPISODES.length}...*\n\n` +
          `📖 Seerah — Biography of the Prophet ﷺ\n` +
          `👤 Sheikh Nabil Al-Awadi\n` +
          `📦 Size: *${episode.size}*\n\n` +
          `_Please wait while the audio is being sent..._`
      },
      { quoted: m }
    )

    // 2️⃣ Stream the MP3 directly as a WhatsApp audio message
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: episode.url },
        mimetype: 'audio/mpeg',
        ptt: false,                           // false = audio player (not voice note)
        fileName: `Seerah_Episode_${String(episode.ep).padStart(2, '0')}_NabilAlAwadi.mp3`,
      },
      { quoted: m }
    )

    // 3️⃣ Send navigation tip after the audio
    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Episode ${episode.ep} sent!*\n\n` +
          `_To listen to another episode, type:_\n` +
          `*.seerah <episode number>*\n\n` +
          `Example: *.seerah ${episode.ep < EPISODES.length ? episode.ep + 1 : 1}*`
      },
      { quoted: m }
    )

  } else {
    // No argument — send the full guide with episode list
    await conn.sendMessage(
      m.chat,
      { text: buildGuide() },
      { quoted: m }
    )
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────
handler.help    = ['seerah']
handler.command = ['seerah']
handler.tags    = ['islamic']
handler.limit   = true
export default handler
