// instagram.com/noureddine_ouafy

import axios from 'axios';

function isUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

function makeid(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function removebg(buffer) {
  if (!buffer) return '⚠️ المرجو إرسال رابط  صورة لإزالة الخلفية.';
  
  if (typeof buffer === 'string' && isUrl(buffer)) {
    const arrayBuffer = await axios.get(buffer, { responseType: 'arraybuffer' });
    buffer = Buffer.from(arrayBuffer.data, 'binary').toString("base64");
  }

  const { data } = await axios.post(
    'https://background-remover.com/removeImageBackground',
    {
      encodedImage: buffer,
      title: `${makeid(5)}.jpg`,
      mimeType: 'image/jpg',
    },
    {
      headers: {
        'content-type': 'application/json',
        origin: 'https://background-remover.com',
        referer: 'https://background-remover.com/upload',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    }
  );

  const base64 = data.encodedImageWithoutBackground.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, 'base64');
}

let handler = async (m, { conn, args, quoted }) => {
  m.reply('⏳ المرجو الانتظار قليلاً، يتم الآن إزالة الخلفية...\ninstagram.com/noureddine_ouafy');

  let buffer;
  try {
    // إذا الصورة في رسالة مقتبسة
    if (quoted && quoted.message && quoted.message.imageMessage) {
      buffer = await conn.downloadMediaMessage(quoted);
    }
    // أو إذا الصورة في نفس الرسالة
    else if (m.message && m.message.imageMessage) {
      buffer = await conn.downloadMediaMessage(m);
    }
    // أو رابط صورة في النص
    else if (args[0] && isUrl(args[0])) {
      buffer = args[0];
    } else {
      return m.reply('❌ المرجو إرسال  رابط صورة لإزالة الخلفية.');
    }

    const bgRemoved = await removebg(buffer);
    await conn.sendFile(m.chat, bgRemoved, 'removed.png', '✅ تمت إزالة الخلفية بنجاح!', m);
  } catch (e) {
    console.error(e);
    m.reply('⚠️ وقع خطأ أثناء المعالجة. حاول مجدداً.');
  }
};

handler.help = ['nobg'];
handler.tags = ['tools'];
handler.command = [ 'nobg'];
handler.limit = true;
export default handler;
