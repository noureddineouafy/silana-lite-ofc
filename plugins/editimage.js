// instagram.com/noureddine_ouafy
// scrape by NirKyy
import axios from 'axios';

let handler = async (m, { conn, text, args }) => {
  const url = args[0];
  const prompt = args.slice(1).join(' ');

  if (!url || !prompt) {
    return m.reply('✳️ من فضلك أرسل الأمر هكذا:\n.editimage [رابط الصورة] [الوصف أو التعديل المطلوب] \n\n *exemple :* .editimage https://cdn.cifumo.xyz/f6/images/a40a73e01df8.jpg make hijab for this girl ');
  }

  const apiUrl = 'https://fluxai.pro/api/images/edit';
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.post(apiUrl, {
        imageUrl: url,
        prompt: prompt,
        isAdvanced: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
          'Referer': 'https://fluxai.pro/ai-photo-editing'
        }
      });

      const imageUrl = response.data.imageUrl;

      const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await conn.sendFile(m.chat, data, 'edit.jpg', `✅ تم التعديل حسب وصفك: ${prompt}`, m);
      return;

    } catch (e) {
      attempts++;
      const status = e.response && e.response.status ? e.response.status : 500;

      if (status === 400) {
        return m.reply('❌ تحقق من الرابط أو النص المطلوب للتعديل، هناك خطأ في الطلب.');
      }

      if (attempts >= maxAttempts) {
        return m.reply(`❌ تعذر تنفيذ الطلب بعد ${maxAttempts} محاولات. يرجى المحاولة لاحقًا.`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

handler.help = ['editimage'];
handler.tags = ['ai'];
handler.command = /^editimage$/i;
handler.limit = true;
export default handler;
