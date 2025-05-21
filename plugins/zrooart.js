// instagram.com/noureddine_ouafy
// scrape from Daffa channel 
import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn, text, command }) => {
  if (!text) {
    return m.reply(`المرجو إدخال وصف للصورة\nمثال:\n.${command} مدينة فوق الغيم`);
  }

  // عرض رسالة انتظار
  await m.reply('المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy');

  const form = new FormData();
  form.append('video_description', text);
  form.append('test_mode', 'false');
  form.append('negative_prompt', 'blurry, distorted, bad quality');
  form.append('aspect_ratio', '16:9');
  form.append('style', 'Fantasy Art');
  form.append('output_format', 'png');
  form.append('seed', '0');

  try {
    const res = await fetch('https://aiart-zroo.onrender.com/generate', {
      method: 'POST',
      headers: {
        accept: '*/*'
      },
      body: form
    });

    const json = await res.json();

    if (!json.success || !json.image_path) {
      return m.reply('حدث خطأ أثناء توليد الصورة:\n' + JSON.stringify(json, null, 2));
    }

    const finalURL = `https://aiart-zroo.onrender.com${json.image_path}?t=${Date.now()}`;
    await conn.sendFile(m.chat, finalURL, 'art.png', `تم توليد الصورة بنجاح بواسطة الذكاء الاصطناعي`, m);

  } catch (e) {
    m.reply('حدث خطأ:\n' + e.message);
  }
};

handler.help = handler.command = ['zrooart'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
