// instagram.com/noureddine_ouafy
import * as cheerio from 'cheerio';

const rednoteDownloader = {
  getToken: async function () {
    const req = await fetch("https://anydownloader.com/en/xiaohongshu-videos-and-photos-downloader");
    if (!req.ok) return null;

    const res = await req.text();
    const $ = cheerio.load(res);
    const token = $("#token").val();

    return { token };
  },

  calculateHash: function (url, salt) {
    return btoa(url) + (url.length + 1_000) + btoa(salt);
  },

  download: async function (url) {
    const conf = await rednoteDownloader.getToken();
    if (!conf) return { error: "فشل في الحصول على التوكن من الموقع.", result: {} };

    const { token } = conf;
    const hash = rednoteDownloader.calculateHash(url, "aio-dl");

    const data = new URLSearchParams();
    data.append('url', url);
    data.append('token', token);
    data.append('hash', hash);

    const req = await fetch(`https://anydownloader.com/wp-json/aio-dl/video-data/`, {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://anydownloader.com",
        "Referer": "https://anydownloader.com/en/xiaohongshu-videos-and-photos-downloader",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: data
    });

    if (!req.ok) return { error: "حدث خطأ أثناء إرسال الطلب.", result: {} };

    try {
      const json = await req.json();
      return {
        input_url: url,
        source: json.source,
        result: {
          title: json.title,
          duration: json.duration,
          thumbnail: json.thumbnail,
          downloadUrls: json.medias
        },
        error: null
      };
    } catch (e) {
      return { error: "خطأ أثناء تحويل الاستجابة إلى JSON", result: {} };
    }
  }
};

let handler = async (m, { conn, args }) => {
  const url = args[0];
  if (!url) {
    return m.reply(`❗ *طريقة الاستخدام:*
.🔻 ارسل الأمر متبوعًا برابط الفيديو:

مثال:
.anydownloader https://xhslink.com/a/xxxxx

🌐 *المنصات المدعومة:*
- Instagram
- Facebook
- Pinterest
- TikTok
- Twitter
- Likee
- Roposo
- ShareChat
- SnackVideo
- Vimeo
- YouTube Shorts
- Douyin
- Xiaohongshu (RED)
- IMDB
- Reddit
    `);
  }

  m.reply("🔄 جاري التحميل، المرجو الانتظار قليلاً...");

  try {
    const res = await rednoteDownloader.download(url);
    if (res.error) return m.reply(`❌ خطأ: ${res.error}`);

    let message = `✅ *anydownloader Video Info*\n\n`;
    message += `📄 *Title:* ${res.result.title}\n`;
    message += `⏱ *Duration:* ${res.result.duration}\n`;

    const media = res.result.downloadUrls?.[0];
    if (!media?.url) return m.reply("❌ لم يتم العثور على رابط التحميل.");

    await conn.sendFile(m.chat, media.url, 'video.mp4', message, m);
  } catch (err) {
    console.error(err);
    m.reply('⚠️ حدث خطأ أثناء التحميل.');
  }
};

handler.help = handler.command = ['anydownloader'];
handler.tags = ['downloader'];
handler.limit = true;
export default handler;
