import axios from "axios";
import yts from "yt-search";

// Supported audio formats
const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];

const ddownr = {
  // Function to download audio from a YouTube URL
  download: async (url, format) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    const response = await axios.request(config);
    if (response.data?.success) {
      const { id, title, info } = response.data;
      const downloadUrl = await ddownr.checkProgress(id);
      return { title, downloadUrl, image: info.image, videoUrl: url };
    } else {
      throw new Error('Failed to fetch video details.');
    }
  },

  // Function to check download progress
  checkProgress: async (id) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    while (true) {
      const response = await axios.request(config);
      if (response.data?.success && response.data.progress === 1000) {
        return response.data.download_url;
      }
      // Wait for 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`Example:\n${command} mellow vibes`);

  try {
    // React with "📥" to indicate download started
    await conn.sendMessage(m.chat, { react: { text: "📥", key: m.key } });

    // Search YouTube for the requested song
    const search = await yts(text);
    const video = search.all[0];
    if (!video) return m.reply('❌ Song not found.');

    // Download audio in mp3 format
    const result = await ddownr.download(video.url, "mp3");

    // Fetch audio as a buffer
    const audioRes = await axios.get(result.downloadUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(audioRes.data, "binary");

    const channelId = "120363377359042191@newsletter"; // Replace with your channel ID

    // Send audio to the channel
    await conn.sendMessage(channelId, {
      audio: audioBuffer,
      mimetype: "audio/mp4",
      ptt: true,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: false,
        externalAdReply: {
          title: result.title,
          body: "S I L A N A -- AI",
          mediaType: 2,
          thumbnailUrl: result.image,
          mediaUrl: result.videoUrl,
          sourceUrl: result.videoUrl,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      }
    });

    // React with "✅" to indicate success
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    m.reply(`✔ Successfully sent *${result.title}* to the channel.`);

  } catch (err) {
    console.error(err);
    // React with "❌" if failed
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    m.reply("❌ Failed to send audio to the channel.");
  }
};

handler.command = ["playch"];
handler.owner = true;
handler.tags = ["owner"];
handler.help = ["playch"];
export default handler;
