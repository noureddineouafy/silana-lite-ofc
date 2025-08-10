import axios from 'axios';
import cheerio from 'cheerio';

// --- Scraper Logic for Instagram ---
const SITE_URL = 'https://instatiktok.com/';

async function instagramDownloader(inputUrl) {
  if (!inputUrl) throw new Error('يرجى تقديم رابط صالح.');

  const form = new URLSearchParams();
  form.append('url', inputUrl);
  form.append('platform', 'instagram');
  form.append('siteurl', SITE_URL);

  try {
    const { data } = await axios.post(`${SITE_URL}api`, form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': SITE_URL,
        'Referer': SITE_URL,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (data.status !== 'success' || !data.html) {
      throw new Error('فشل في استرداد البيانات. قد يكون الرابط خاصًا أو غير صالح.');
    }

    const $ = cheerio.load(data.html);
    const links = [];
    $('a.btn[href^="http"]').each((_, el) => {
      const link = $(el).attr('href');
      if (link && !links.includes(link)) {
        links.push(link);
      }
    });

    if (links.length === 0) throw new Error('لم يتم العثور على روابط قابلة للتنزيل.');

    return {
      status: true,
      download: links // Instagram can have multiple images/videos
    };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ غير معروف أثناء جلب البيانات.');
  }
}

// --- Handler Code ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*الاستخدام:* ${usedPrefix}${command} <رابط انستغرام>\n\n*مثال:* ${usedPrefix}${command} https://www.instagram.com/p/C...`;

  try {
    await m.reply('⏳ جاري معالجة طلبك... يرجى الانتظار.');

    const result = await instagramDownloader(text);
    
    // Instagram can return multiple URLs in an array
    for (const url of result.download) {
      await conn.sendFile(m.chat, url, '', `✨ تم التنزيل من انستغرام`, m);
      // تأخير بسيط بين إرسال الملفات المتعددة
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (e) {
    await m.reply(`❌ خطأ: ${e.message}`);
  }
};

handler.help = ['insta-dl'];
handler.tags = ['downloader'];
// New command names
handler.command = ['insta-dl']; 
handler.limit = true;
handler.premium = false;
export default handler;
