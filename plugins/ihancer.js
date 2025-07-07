/**
 * @instagram.com/noureddine_ouafy
 * @plugin: Ihancer Image Enhancer
 * @base: https://ihancer.com
 * scrape by rynn-stuff
 */

import axios from 'axios';
import FormData from 'form-data';

async function ihancer(buffer, { method = 1, size = 'low' } = {}) {
  try {
    const _size = ['low', 'medium', 'high'];

    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('📸 الصورة غير موجودة');
    if (method < 1 || method > 4) throw new Error('🛠️ الطرق المتوفرة: 1, 2, 3, 4');
    if (!_size.includes(size)) throw new Error(`📏 الأحجام المتوفرة: ${_size.join(', ')}`);

    const form = new FormData();
    form.append('method', method.toString());
    form.append('is_pro_version', 'false');
    form.append('is_enhancing_more', 'false');
    form.append('max_image_size', size);
    form.append('file', buffer, `silana_${Date.now()}.jpg`);

    const { data } = await axios.post('https://ihancer.com/api/enhance', form, {
      headers: {
        ...form.getHeaders(),
        'accept-encoding': 'gzip',
        host: 'ihancer.com',
        'user-agent': 'Dart/3.5 (dart:io)'
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(data);
  } catch (error) {
    throw new Error(`❌ خطأ: ${error.message}`);
  }
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!m.quoted || !/image/.test(m.quoted.mimetype)) {
    return m.reply(`📸 من فضلك قم بالرد على صورة لتحسينها\nمثال: *${usedPrefix + command} high*`);
  }

  let size = (args[0] || 'low').toLowerCase();
  const qimg = await m.quoted.download();

  m.reply('⏳ المرجو الانتظار قليلاً... \nلا تنسى متابعتي على: instagram.com/noureddine_ouafy');

  try {
    const result = await ihancer(qimg, { size });
    await conn.sendFile(m.chat, result, 'ihancer.jpg', '✨ تم تحسين الصورة بنجاح!', m);
  } catch (e) {
    m.reply(`❌ وقع خطأ: ${e.message}`);
  }
};

handler.help = ['ihancer'];
handler.command = ['ihancer'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
