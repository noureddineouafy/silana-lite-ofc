// instagram.com/noureddine_ouafy

import axios from 'axios';

let handler = async (m, { conn }) => {
  let mediaMessage = null;

  // ✅ إذا كانت صورة مرسلة مباشرة
  if (m.mimetype?.startsWith('image')) {
    mediaMessage = m;
  }
  // ✅ إذا كانت صورة مقتبسة (رد على صورة)
  else if (m.quoted?.mimetype?.startsWith('image')) {
    mediaMessage = m.quoted;
  }
  // ❌ إن لم تكن صورة في أي من الحالتين
  else {
    return m.reply(`❗ أرسل صورة أو قم بالرد على صورة ثم اكتب *.hd*`);
  }

  try {
    await m.reply('🔄 المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy');

    // تحميل الصورة
    const buffer = await mediaMessage.download();
    if (!buffer || buffer.length === 0) {
      return m.reply('❌ فشل تحميل الصورة. جرب مجددًا.');
    }

    // رفع الصورة إلى Imgbb
    const uploadedUrl = await uploadToImgbb(buffer);
    if (!uploadedUrl) return m.reply('❌ فشل في رفع الصورة مؤقتاً.');

    // تحسين الجودة
    const apiUrl = `https://nirkyy-dev.hf.space/api/v1/ai-upscale?url=${encodeURIComponent(uploadedUrl)}&scale=4`;

    // إرسال الصورة النهائية
    await conn.sendFile(m.chat, apiUrl, 'hd.jpg', '✅ تم تحسين جودة الصورة بنجاح', m);

  } catch (e) {
    console.error('❌ خطأ في .hd:', e);
    await m.reply(`❌ حدث خطأ أثناء المعالجة:\n${e.message}`);
  }
};

handler.help = ['hd','remini'];
handler.tags = ['tools'];
handler.command = /^hd|remini$/i;
handler.limit = true;

export default handler;

// ------------------------
// 📦 دالة رفع إلى Imgbb
// ------------------------

const uploadToImgbb = async (buffer) => {
  try {
    const bytes = Array.from(new Uint8Array(buffer));
    const endpoint = "https://nirkyy-dev.hf.space/api/v1/toimgbb";

    const response = await axios.post(endpoint, {
      file: { data: bytes }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    if (response.data?.data?.url) {
      return response.data.data.url;
    } else {
      throw new Error('⚠️ الرد من API غير صالح.');
    }
  } catch (error) {
    const errMsg = error.response?.data || error.message;
    console.error("❌ فشل رفع الصورة:", errMsg);
    throw new Error('❌ فشل رفع الصورة إلى الخادم.');
  }
};
