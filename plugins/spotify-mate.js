// instagram.com/noureddine_ouafy
import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { conn, text }) => {
  const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36';
  const mainUrl = 'https://spotmate.online/en';
  const convertUrl = 'https://spotmate.online/convert';

  if (!text || !text.includes('spotify.com')) {
    return m.reply('🔗 المرجو إدخال رابط من Spotify.\nمثال: *.spotify-mate https://open.spotify.com/track/xxx*');
  }

  let csrfToken = '';
  let sessionCookie = '';

  try {
    // الخطوة 1: جلب الصفحة الرئيسية للحصول على التوكن والكوكيز
    const initialRes = await axios.get(mainUrl, {
      headers: { 'User-Agent': userAgent }
    });

    const $ = cheerio.load(initialRes.data);
    csrfToken = $('meta[name="csrf-token"]').attr('content');

    if (!csrfToken) {
      return m.reply('⚠️ لم يتم العثور على التوكن اللازم للطلب.');
    }

    const allCookies = initialRes.headers['set-cookie'];
    if (allCookies && Array.isArray(allCookies)) {
      sessionCookie = allCookies.map(c => c.split(';')[0]).join('; ');
    }
  } catch (e) {
    console.error(e);
    return m.reply('❌ فشل في الاتصال بـ Spotmate. حاول لاحقاً.');
  }

  let downloadLink = '';
  try {
    // الخطوة 2: إرسال رابط Spotify لتحويله
    const postData = { urls: text };
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'User-Agent': userAgent,
      'Referer': mainUrl,
    };

    if (sessionCookie) headers['Cookie'] = sessionCookie;

    const convRes = await axios.post(convertUrl, postData, { headers });

    if (convRes.data.error || !convRes.data.url) {
      return m.reply(`❌ فشل التحويل: ${convRes.data.message || 'سبب غير معروف'}`);
    }

    downloadLink = convRes.data.url;
  } catch (e) {
    console.error(e);
    return m.reply('🚫 فشل أثناء تحويل رابط Spotify.');
  }

  try {
    // الخطوة 3: تحميل الملف الصوتي من الرابط النهائي
    const streamRes = await axios.get(downloadLink, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': userAgent,
        'Referer': mainUrl
      }
    });

    const filename = 'spotify_track.mp3';
    await conn.sendFile(m.chat, Buffer.from(streamRes.data), filename, `🎵 تم التحميل من الرابط:\n${text}`, m);
  } catch (e) {
    console.error(e);
    return m.reply('⚠️ فشل تحميل الملف من السيرفر.');
  }
};

handler.help = ['spotify-mate'];
handler.command = ['spotify-mate'];
handler.tags = ['downloader'];
handler.limit = true;
export default handler;
