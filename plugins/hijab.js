// Instagram: noureddine_ouafy
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

let handler = async (m, { conn, command }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  if (!mime) return m.reply(`Send or reply to an image with the caption *.${command}*`);
  if (!/image\/(jpe?g|png)/.test(mime)) return m.reply(`Format ${mime} is not supported! Only jpeg/jpg/png`);

  await conn.sendMessage(m.chat, { react: { text: '🖐', key: m.key } });

  try {
    let imgData = await q.download();

    const form = new FormData();
    form.append('image', imgData, {
      filename: 'upload.jpg',
      contentType: mime
    });

    const response = await axios.post('https://xyro.site/fun/hijabkan', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer'
    });

    const tempPath = path.join(process.cwd(), 'tmp', `result_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, response.data);

    await conn.sendMessage(
      m.chat,
      {
        image: fs.readFileSync(tempPath),
        caption: '✅ Image processed successfully'
      },
      { quoted: m }
    );

    setTimeout(() => {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.error('Failed to delete temporary file:', e);
      }
    }, 30000);

  } catch (error) {
    console.error('[HIJABKAN ERROR]', error);

    let errorMessage = 'Failed to process image';
    if (error.response) {
      try {
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          'Error from API';
      } catch {
        errorMessage = 'Invalid error format';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    m.reply(`Error: ${errorMessage}`);
  }
};

handler.help = ['hijab'];
handler.tags = ['ai'];
handler.command = /^hijab$/i;
handler.limit = true 
export default handler;
