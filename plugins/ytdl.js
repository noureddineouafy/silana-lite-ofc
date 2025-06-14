// instagram.com/noureddine_ouafy
import axios from 'axios';
import FormData from 'form-data';

let handler = async (m, { conn, args, command }) => {
  let url = args[0];
  let quality = args[1] || '720';

  if (!url) return m.reply(`❗ من فضلك أدخل رابط YouTube.\nمثال:\n*.ytdl https://youtu.be/dQw4w9WgXcQ*`);
  if (!isValidYouTubeUrl(url)) return m.reply(`❌ الرابط غير صالح، يجب أن يكون رابط YouTube.`);

  m.reply("⏳ المرجو الانتظار قليلاً، لا تنسى متابعتي على:\ninstagram.com/noureddine_ouafy");

  let result;
  if (command.includes("mp3")) {
    result = await youtubeMp3(url);
  } else {
    result = await ytdl(url, quality);
  }

  if (!result.success) return m.reply(`❌ خطأ: ${result.error.message}`);

  let { title, downloadUrl, image, type, quality: q } = result.data;

  if (type === 'mp3') {
    await conn.sendFile(m.chat, downloadUrl, title + '.mp3', `🎧 *${title}*`, m, false, { mimetype: 'audio/mp4' });
  } else {
    await conn.sendFile(m.chat, downloadUrl, title + '.mp4', `🎬 *${title}*\n📥 الجودة: ${q}`, m);
  }
};

handler.help = ['ytdl', 'ytdlmp3'];
handler.tags = ['downloader'];
handler.command = ['ytdl', 'ytdlmp3'];
handler.limit = true;
export default handler;

// ✅ الأدوات المدمجة

function isValidYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

async function youtubeMp3(url) {
  try {
    const ds = new FormData();
    ds.append("url", url);

    const { data } = await axios.post(
      "https://www.youtubemp3.ltd/convert",
      ds,
      {
        headers: {
          ...ds.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 45000
      }
    );

    if (!data || !data.link) {
      return { success: false, error: { message: "لم يتم العثور على رابط التحميل." } };
    }

    return {
      success: true,
      data: {
        title: data.filename || "Unknown Title",
        downloadUrl: data.link,
        type: "mp3"
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.response?.data?.message || error.message || "حدث خطأ أثناء التحويل إلى MP3"
      }
    };
  }
}

async function ytdl(url, quality = "720") {
  try {
    const validQuality = {
      "480": 480,
      "1080": 1080,
      "720": 720,
      "360": 360,
      "audio": "mp3",
    };

    if (!Object.keys(validQuality).includes(quality)) {
      return {
        success: false,
        error: {
          message: "⚠️ الجودة غير صالحة. الجودات المدعومة: " + Object.keys(validQuality).join(', ')
        }
      };
    }

    const q = validQuality[quality];

    const { data: firstRequest } = await axios.get(
      `https://p.oceansaver.in/ajax/download.php?button=1&start=1&end=1&format=${q}&iframe_source=https://allinonetools.com/&url=${encodeURIComponent(url)}`,
      {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!firstRequest || !firstRequest.progress_url) {
      return {
        success: false,
        error: { message: "فشل بدء عملية التحميل." }
      };
    }

    const { progress_url } = firstRequest;
    let attempts = 0, maxAttempts = 40, datas;

    do {
      if (attempts >= maxAttempts) {
        return { success: false, error: { message: "⏱️ استغرقت العملية وقتاً طويلاً." } };
      }

      await new Promise(r => setTimeout(r, 3000));

      try {
        const { data } = await axios.get(progress_url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        datas = data;
      } catch {}

      attempts++;
    } while (!datas?.download_url);

    return {
      success: true,
      data: {
        title: firstRequest.info?.title || "Unknown Title",
        image: firstRequest.info?.image || "",
        downloadUrl: datas.download_url,
        quality,
        type: quality === "audio" ? "mp3" : "mp4"
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.response?.data?.message || error.message || "❌ حدث خطأ أثناء التحميل."
      }
    };
  }
      }
