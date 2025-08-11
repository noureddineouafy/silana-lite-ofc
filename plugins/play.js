// instagram.com/noureddine_ouafy
import axios from 'axios';

let handler = async (m, { conn, text, command }) => {
  if (!text) {
    return m.reply('🚫 من فضلك أرسل اسم الأغنية بعد الأمر.\nمثال: \n\n*.play hello*');
  }

  try {
    // نطلب معلومات الأغنية من API الخارجي
    const res = await axios.get(`https://pursky.vercel.app/api/ytplay?q=${encodeURIComponent(text)}`);
    const audio = res.data?.audio;

    if (!audio) {
      return m.reply('❌ فشل في جلب رابط الصوت من API الخارجي، حاول مجدداً.');
    }

    // تهيئة الهيدر
    const headers = res.data.note?.headers || {};
    const audioRes = await axios.get(audio, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Linux; Android 10)',
        'Referer': headers['Referer'] || audio
      }
    });

    let filename = text.replace(/\s+/g, '_') + '.mp3';

    // إرسال الملف الصوتي
    await conn.sendFile(m.chat, Buffer.from(audioRes.data), filename, `🎵 تم تحميل: ${text}`, m);
  } catch (err) {
    console.error(err);
    return m.reply('⚠️ حدث خطأ أثناء تحميل الصوت.');
  }
};

handler.help = ['play'];
handler.command = ['play'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
