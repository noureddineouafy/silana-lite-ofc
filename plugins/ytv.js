// instagram.com/noureddine_ouafy

import axios from 'axios';

function getRandomIp() {
  return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
}

async function ytdl(youtubeUrl) {
  const apiUrl = `https://api.yogik.id/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=video`;
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  const referer = 'https://y2kid.yogik.id/';
  const ip = getRandomIp();

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': referer,
        'X-Forwarded-For': ip
      }
    });

    const data = response.data;

    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.status && data.result) {
      return data.result;
    } else {
      throw new Error('❌ Failed to retrieve video data.');
    }
  } catch (err) {
    return { error: err.message };
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return m.reply('📥 Please send a valid YouTube link.\n\nExample:\n.ytv https://youtube.com/watch?v=xxxxx');
  }

  m.reply('⏳ Please wait, downloading video...\ninstagram.com/noureddine_ouafy');

  const result = await ytdl(args[0]);

  if (result?.error) {
    return m.reply(`❌ Error: ${result.error}`);
  }

  if (!result.download_url) {
    return m.reply('❌ Error: Video download_url not found in the API response.');
  }

  const { title, download_url, author_name, thumbnail_url } = result;

  try {
    await conn.sendMessage(m.chat, {
      document: { url: download_url },
      fileName: `${title}.mp4`,
      mimetype: 'video/mp4',
      caption: `🎬 *${title}*\n👤 Author: ${author_name}`,
      jpegThumbnail: await (await axios.get(thumbnail_url, { responseType: 'arraybuffer' })).data
    }, { quoted: m });
  } catch (sendErr) {
    m.reply('❌ Failed to send video file.\n' + sendErr.message);
  }
};

handler.help = ['ytv'];
handler.command = ['ytv'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
