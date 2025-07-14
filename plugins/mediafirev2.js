// @noureddine_ouafy
// MediaFire Downloader Plugin using Keith API

import axios from 'axios';

let handler = async (m, { conn, args }) => {
  const mediafireUrl = args[0];
  if (!mediafireUrl || !mediafireUrl.includes("mediafire.com")) {
    return m.reply('✅ المرجو إدخال رابط ميديافاير صالح. مثال: .mediafirev2 https://www.mediafire.com/...');
  }

  await m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const apiUrl = `https://apis-keith.vercel.app/download/mfire?url=${encodeURIComponent(mediafireUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.status || !response.data.result || !response.data.result.dl_link) {
      return m.reply('❌ لم أستطع استخراج الملف. المرجو التحقق من الرابط.');
    }

    const { fileName, fileType, size, date, dl_link } = response.data.result;

    await m.reply(`📂 *جاري تحميل الملف ${fileName}...*`);

    const fileRes = await axios.get(dl_link, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileRes.data, 'binary');

    const caption = `📂 *تفاصيل الملف:*\n\n` +
                    `🔖 *الاسم:* ${fileName}\n` +
                    `📏 *الحجم:* ${size}\n` +
                    `📅 *تاريخ الرفع:* ${date}\n\n` +
                    `> 📥 تم التحميل بواسطة Silana Bot`;

    await conn.sendMessage(m.chat, {
      document: fileBuffer,
      mimetype: fileType,
      fileName: fileName,
      caption
    }, { quoted: m });

    await m.reply("✅ تم إرسال الملف بنجاح.");
  } catch (e) {
    console.error('Mediafirev2 download error:', e);
    await m.reply('❌ حصل خطأ أثناء تحميل الملف. حاول لاحقًا.');
  }
};

handler.help = ['mediafirev2'];
handler.tags = ['downloader'];
handler.command = ['mediafirev2'];
handler.limit = true;
export default handler;
