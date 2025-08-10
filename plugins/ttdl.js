import axios from 'axios';
import cheerio from 'cheerio';

// --- Scraper Logic for TikTok ---
const SITE_URL = 'https://instatiktok.com/';

async function tiktokDownloader(inputUrl) {
  if (!inputUrl) throw new Error('يرجى تقديم رابط صالح.');

  const form = new URLSearchParams();
  form.append('url', inputUrl);
  form.append('platform', 'tiktok');
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

    // Prefer the link without a watermark if available
    const downloadUrl = links.find(link => /hdplay|nowm/i.test(link)) || links[0];

    return {
      status: true,
      download: downloadUrl
    };
  } catch (error) {
    throw new Error(error.message || 'حدث خطأ غير معروف أثناء جلب البيانات.');
  }
}

// --- Handler Code ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*الاستخدام:* ${usedPrefix}${command} <رابط تيك توك>\n\n*مثال:* ${usedPrefix}${command} https://www.tiktok.com/@user/video/123...`;

  try {
    await m.reply('⏳ جاري معالجة طلبك... يرجى الانتظار.');

    const result = await tiktokDownloader(text);
    
    await conn.sendFile(m.chat, result.download, '', `✨ تم التنزيل من تيك توك`, m);

  } catch (e) {
    await m.reply(`❌ خطأ: ${e.message}`);
  }
};

handler.help = ['ttdl'];
handler.tags = ['downloader'];
handler.command = ['ttdl'];
handler.limit = true;
handler.premium = false;
export default handler;
