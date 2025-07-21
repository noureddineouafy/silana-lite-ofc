// ocr support also arabic 
// plugin by noureddine Ouafy 
//scrape by GilangSan


import axios from 'axios';
import FormData from 'form-data';

/**
 * Performs OCR on an image buffer using the ocr.space API.
 * @param {Buffer} imageBuffer The image data as a buffer.
 * @returns {Promise<string>} The extracted text.
 */
async function performOcr(imageBuffer) {
  if (!imageBuffer) {
    throw new Error('لم يتم توفير بيانات الصورة.');
  }

  try {
    const form = new FormData();
    form.append('file', imageBuffer, { filename: 'image.jpg' });
    form.append('language', 'ara'); // اللغة العربية
    form.append('isOverlayRequired', 'false');

    // -- التغيير الرئيسي هنا --
    // تم تغيير المحرك إلى رقم 1 لضمان التوافق مع اللغة العربية
    form.append('OCREngine', '1'); 

    const { data } = await axios.post('https://api8.ocr.space/parse/image', form, {
      headers: {
        ...form.getHeaders(),
        // هام: استبدل هذا بمفتاح API الخاص بك
        'Apikey': 'donotstealthiskey_ip1',
      },
      timeout: 45000, 
    });

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage.join('\n'));
    }

    const parsedText = data.ParsedResults?.[0]?.ParsedText;

    if (!parsedText || parsedText.trim() === '') {
      throw new Error('تعذر استخراج النص من الصورة. قد تكون الصورة فارغة أو غير واضحة.');
    }

    return parsedText;

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(error.response ? `API Error: ${JSON.stringify(error.response.data)}` : error.message);
  }
}

// دالة المعالج الرئيسية
let handler = async (m, { conn }) => {
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';

  if (!/image/.test(mime)) {
    return m.reply('يرجى الرد على صورة مع الأمر لقراءة النص الموجود بها. 🖼️');
  }

  try {
    await m.reply('🔍 جاري قراءة النص من الصورة، يرجى الانتظار...');

    const imgBuffer = await quoted.download();
    if (!imgBuffer) {
      throw new Error('فشل تحميل الصورة.');
    }

    const text = await performOcr(imgBuffer);

    await m.reply(text.trim());

  } catch (e) {
    await m.reply(`❌ حدث خطأ:\n${e.message}`);
  }
};

// إعدادات الأمر
handler.help = ['totext'];
handler.command = ['totext'];
handler.tags = ['tools'];
handler.limit = true; 
export default handler;
