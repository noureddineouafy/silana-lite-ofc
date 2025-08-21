// noureddine ouafy
// plugin from another sc Terakomari_-_MD

import axios from "axios";
import yts from "yt-search";

const ytiz = {
  info: async (url) => {
    const { data } = await axios.post(
      "https://m1.fly.dev/api/info",
      { url, startTime: 0, endTime: 0, format: "mp3" },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0)",
          "Content-Type": "application/json",
          "accept-language": "en-US",
          referer: "https://ytiz.xyz/",
          origin: "https://ytiz.xyz",
        },
      }
    );
    return data;
  },

  download: async (url) => {
    const { filename, randID } = await ytiz.info(url);
    const { data } = await axios.post(
      "https://m1.fly.dev/api/download",
      {
        url,
        quality: "128",
        metadata: true,
        filename,
        randID,
        trim: false,
        startTime: 0,
        endTime: 0,
        format: "mp3",
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0)",
          "Content-Type": "application/json",
          "accept-language": "en-US",
          referer: "https://ytiz.xyz/",
          origin: "https://ytiz.xyz",
        },
      }
    );
    return data;
  },

  getBuffer: async (url) => {
    const { filepath, randID } = await ytiz.download(url);
    const { data } = await axios.post(
      "https://m1.fly.dev/api/file_send",
      { filepath, randID },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0)",
          "Content-Type": "application/json",
          "accept-language": "en-US",
          referer: "https://ytiz.xyz/",
          origin: "https://ytiz.xyz",
        },
        responseType: "arraybuffer",
      }
    );
    return data;
  },
};

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply("❌ Please provide a search query.");

  m.reply("⏳ Searching and downloading the song, please wait...");

  try {
    const query = args.join(" ");
    const results = await yts(query);
    if (!results.videos.length) return m.reply("❌ No results found for that search.");

    const bestVideo = results.videos[0];
    const fileBuffer = await ytiz.getBuffer(bestVideo.url);

    let thumb;
    try {
      thumb = (await axios.get(bestVideo.thumbnail, { responseType: "arraybuffer" })).data;
    } catch {
      thumb = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
        "base64"
      );
    }

    await conn.sendMessage(m.chat, {
      audio: fileBuffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        externalAdReply: {
          title: "🎵 YouTube Song",
          body: bestVideo.title,
          mediaType: 2,
          mediaUrl: bestVideo.url,
          sourceUrl: bestVideo.url,
          thumbnail: thumb,
        },
      },
    });
  } catch (err) {
    console.error(err);
    m.reply("❌ An error occurred while searching or downloading the audio.");
  }
};

handler.help = ["song"];
handler.tags = ["downloader"];
handler.command = ["song"];
handler.limit = true;

export default handler;
