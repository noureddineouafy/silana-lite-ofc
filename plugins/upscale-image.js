// @instagram.com/noureddine_ouafy
// Plugin: Scrape Upscale (HD IMAGE)
// Source: https://www.upscale-image.com
// scrape by SaaOffc
import axios from 'axios';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

async function upscale(imageBuffer) {
  try {
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const response = await axios.post(
      'https://www.upscale-image.com/api/upscale',
      {
        image: base64Image,
        model: 'fal-ai/esrgan',
        width: 1200,
        height: 1200,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://www.upscale-image.com',
          Referer: 'https://www.upscale-image.com',
        },
      }
    );

    const { upscaledImageUrl, width, height, fileSize } = response.data;
    if (!upscaledImageUrl) throw new Error('❌ لم يتم العثور على رابط الصورة المحسّنة');

    return {
      url: upscaledImageUrl,
      width,
      height,
      fileSize: formatBytes(fileSize),
    };
  } catch (err) {
    throw new Error(`⚠️ فشل في تحسين الصورة:\n${err?.response?.data?.message || err.message}`);
  }
}

let handler = async (m, { conn }) => {
  if (
    !m.quoted ||
    typeof m.quoted.download !== 'function' ||
    !(m.quoted.mimetype && m.quoted.mimetype.startsWith('image/'))
  ) {
    return m.reply('📸 من فضلك قم بالرد على صورة لاستخدام هذا الأمر بنجاح.');
  }

  m.reply("🔄 المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const imageBuffer = await m.quoted.download();
    const { url, width, height, fileSize } = await upscale(imageBuffer);

    await conn.sendFile(
      m.chat,
      url,
      'upscaled.jpg',
      `✅ تم تحسين الصورة بنجاح:\n\n📏 الأبعاد: ${width}x${height}\n💾 الحجم: ${fileSize}`,
      m
    );
  } catch (e) {
    m.reply(e.message);
  }
};

handler.help = ['upscale-image'];
handler.tags = ['ai'];
handler.command = ['upscale-image'];
handler.limit = true;

export default handler;
