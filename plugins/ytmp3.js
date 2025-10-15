// instagram.com/noureddine_ouafy
// © Silana Bot by noureddine
// plugin from Ruby-Hoshino-Bot script // thanks to owner 
import fetch from 'node-fetch';

const newsletterJid = '120363285847738492@newsletter'; // ✅ your real channel ID
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡『 Silana Bot Channel 』࿐⟡';

// ✅ Define the Silana Bot thumbnail (you can replace the URL with your own logo)
const icons = 'https://i.ibb.co/vzRkHqR/silana.jpg';

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const emoji = '🎵';
  const contextInfo = {
    mentionedJid: [m.sender],
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName,
      serverMessageId: -1
    },
    externalAdReply: {
      title: 'Silana Bot 💎',
      body: 'Developed by noureddine_ouafy',
      thumbnailUrl: icons,
      sourceUrl: 'https://whatsapp.com/channel/0029VaFjVUd6YQivyiK1WJ3B', // ✅ your WhatsApp channel link if available
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(
      m.chat,
      `${emoji} *Oops!* Please send a YouTube link to download the audio.\n\nExample:\n\`${usedPrefix + command} https://youtu.be/KHgllosZ3kA\`\n\n🌐 © Silana Bot`,
      m,
      { contextInfo, quoted: m }
    );
  }

  try {
    await conn.reply(
      m.chat,
      `🌸 *Processing your request...*\nPlease wait a moment 🎧\n\n💠 Powered by *Silana Bot*`,
      m,
      { contextInfo, quoted: m }
    );

    const url = args[0];
    const apiUrl = `https://dark-core-api.vercel.app/api/download/YTMP3?key=api&url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.status || !json.download) {
      return conn.reply(
        m.chat,
        `❌ *Failed to download audio.*\nReason: ${json.message || 'Invalid API response.'}\n\n🌐 © Silana Bot`,
        m,
        { contextInfo, quoted: m }
      );
    }

    const audioRes = await fetch(json.download);
    const audioBuffer = await audioRes.buffer();

    const caption = `
╭───[ 𝚈𝚃𝙼𝙿𝟹 • 🎶 ]───⬣
📌 *Title:* ${json.title}
📁 *Format:* ${json.format}
📎 *Source:* ${url}
╰────────────────⬣

🌐 © Silana Bot — instagram.com/noureddine_ouafy`;

    await conn.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${json.title}.mp3`,
        ptt: false,
        caption
      },
      { contextInfo, quoted: m }
    );

  } catch (e) {
    console.error(e);
    await conn.reply(
      m.chat,
      `❌ *An error occurred while processing the audio.*\nDetails: ${e.message}\n\n💠 © Silana Bot`,
      m,
      { contextInfo, quoted: m }
    );
  }
};

handler.help = ['ytmp3'];
handler.tags = ['downloader'];
handler.command = ['ytmp3'];
handler.limit = true;

export default handler;
