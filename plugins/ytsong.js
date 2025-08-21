import axios from "axios";

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
  if (!args[0]) return m.reply('Please enter the YouTube URL');

  m.reply("Hold on, downloading the mp3...");

  try {
    const url = args[0];
    const info = await ytiz.info(url);
    const fileBuffer = await ytiz.getBuffer(url);

    let thumb;
    try {
      thumb = (await axios.get(info.thumbnail, { responseType: 'arraybuffer' })).data;
    } catch {
      // fallback thumbnail if unable to fetch
      thumb = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
        "base64"
      );
    }

    await conn.sendMessage(m.chat, {
      audio: fileBuffer,
      mimetype: 'audio/mpeg',
      contextInfo: {
        externalAdReply: {
          title: 'YT MP3 : BY Allen',
          body: info.title || "YouTube Audio",
          mediaType: 2,
          mediaUrl: url,
          sourceUrl: url,
          thumbnail: thumb
        }
      }
    });

  } catch (err) {
    console.error(err);
    m.reply('An error occurred while downloading the audio.');
  }
};

handler.help = ['ytsong'];
handler.tags = ['downloader'];
handler.command = ['ytsong'];
handler.limit = true;

export default handler;
