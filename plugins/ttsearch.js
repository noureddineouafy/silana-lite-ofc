// @instagram: noureddine_ouafy

import axios from 'axios';

const searchCache = new Map();

async function ttSearch(query) {
  const response = await axios("https://tikwm.com/api/feed/search", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "cookie": "current_language=en",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    },
    data: {
      keywords: query,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1,
    }
  });
  return response.data.data;
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `📌 Example:\n${usedPrefix + command} cats`;

  // Check if input is a number (reply)
  if (/^\d+$/.test(text.trim())) {
    let number = parseInt(text.trim());
    let cache = searchCache.get(m.sender);

    if (!cache || !cache.results) {
      return m.reply("❌ No previous search found. Use:\n.ttsearch cats");
    }

    let video = cache.results[number - 1];
    if (!video) return m.reply("⚠️ Invalid number.");

    let videoUrl = "https://tikwm.com" + video.play;
    let audioUrl = "https://tikwm.com" + video.music;

    m.reply("📥 Downloading TikTok video and audio. Please wait...");

    try {
      // Download video and audio as buffer
      let videoBuffer = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
      let audioBuffer = (await axios.get(audioUrl, { responseType: 'arraybuffer' })).data;

      // Send video
      await conn.sendFile(
        m.chat,
        videoBuffer,
        'video.mp4',
        `🎬 Title: ${video.title}\n👤 Author: ${video.author.nickname}`,
        m
      );

      // Send audio
      await conn.sendFile(
        m.chat,
        audioBuffer,
        'audio.mp3',
        `🎵 Music: ${video.music_info.title}\n🎤 Author: ${video.music_info.author}`,
        m
      );

    } catch (e) {
      return m.reply("❌ Failed to download video or audio.");
    }
    return;
  }

  // Search query
  try {
    let results = (await ttSearch(text)).videos;
    if (!results || results.length === 0) throw '❌ No results found.';

    // Save results in memory
    searchCache.set(m.sender, { query: text, results });

    let message = `📥 *Search Results for:* ${text}\n🧾 *Reply with a number to download*\n\n`;

    for (let i = 0; i < results.length; i++) {
      message += `*${i + 1}. ${results[i].title}*\n👤 ${results[i].author.nickname}\n───────────────\n`;
    }

    await m.reply(message.trim());
  } catch (err) {
    throw `❌ Error: ${err.message || err}`;
  }
};

handler.help = ["ttsearch"];
handler.tags = ["search"];
handler.command = ["ttsearch"];
handler.limit = true;

export default handler;
