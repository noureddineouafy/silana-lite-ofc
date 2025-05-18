// instagram.com/noureddine_ouafy

import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply('المرجو إرسال رابط تغريدة يحتوي على فيديو');

  await m.reply('المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy');

  try {
    const form = new FormData();
    form.append('q', text);
    form.append('lang', 'en');
    form.append('cftoken', '');

    const { data } = await axios.post('https://savetwitter.net/api/ajaxSearch', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    if (!data.data) throw 'لم يتم العثور على الفيديو أو الرابط غير صالح';

    const $ = cheerio.load(data.data);
    const thumbnail = $('.image-tw img').attr('src');
    const result = [];

    $('.dl-action a').each((_, el) => {
      const link = $(el).attr('href');
      const label = $(el).text().trim();
      if (link && label.includes('Download MP4')) {
        result.push({
          quality: label.replace('Download MP4', '').trim().replace('(', '').replace(')', ''),
          url: link,
          thumbnail
        });
      }
    });

    if (result.length === 0) throw 'لم يتم العثور على روابط تحميل الفيديو';

    const best = result[0]; // اختار أول جودة متوفرة (عادة الأفضل)
    const res = await axios.get(best.url, { responseType: 'arraybuffer' });

    await conn.sendFile(m.chat, Buffer.from(res.data), 'twitter.mp4', null, m);

  } catch (e) {
    console.error(e);
    m.reply('حدث خطأ أثناء تحميل فيديو تويتر. تأكد من أن الرابط صحيح.');
  }
};

handler.help = ['twitterdl'];
handler.tags = ['downloader'];
handler.command = /^twitterdl$/i;
handler.limit = true;
export default handler;
