// Instagram: noureddine_ouafy
import fetch from 'node-fetch';
import moment from 'moment-timezone';
import FormData from 'form-data';
import axios from 'axios';

// Function to upload image to Uguu
async function Uguu(buffer, filename) {
  const form = new FormData();
  form.append('files[]', buffer, { filename });

  const { data } = await axios.post('https://uguu.se/upload.php', form, {
    headers: form.getHeaders(),
  });

  if (data.files && data.files[0]) {
    return data.files[0].url;
  } else {
    throw new Error('Upload failed.');
  }
}

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  if (!mime.startsWith('image/')) 
    return m.reply('Send an image or reply to an image with the caption *.removewm*');

  try {
    m.reply('⏳ Removing watermark, please wait...');
    let media = await q.download();
    let uploadedUrl = await Uguu(media, 'image.png');

    let apiUrl = `https://arincy.vercel.app/api/removewm?url=${encodeURIComponent(uploadedUrl)}`;
    let res = await fetch(apiUrl);
    let json = await res.json();

    if (!json.status) return m.reply('Failed to process the image.');

    let {
      input,
      output,
      urls,
      retention,
      createdAt,
      consumedCredits
    } = json.data;

    let formattedTime = moment(createdAt).tz('Asia/Jakarta').format('dddd, DD MMMM YYYY HH:mm:ss');

    let caption = `
🧹 *Watermark Removed*
🔗 *Original:* ${input.image}
🕒 *Created At:* ${formattedTime} WIB
📦 *Retention:* ${retention}
💳 *Credits Used:* ${consumedCredits}
📎 *API URL:* ${urls.get}
`.trim();

    for (let out of output) {
      await conn.sendMessage(m.chat, { image: { url: out }, caption }, { quoted: m });
    }

  } catch (e) {
    console.error(e);
    m.reply('An error occurred while processing the image.');
  }
};

handler.help = ['removewm'];
handler.tags = ['tools'];
handler.command = ['removewm'];
handler.limit = true;

export default handler;
