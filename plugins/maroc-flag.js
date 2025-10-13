// plugin by Obito 
// thanks ❤️
import fs from 'fs';
import fetch from 'node-fetch';
import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const handler = async (m, { conn }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';

  if (!mime || !mime.startsWith("image/")) {
    return m.reply("Please reply to an image with this command *.maroc-flag*");
  }

  try {
    await m.react('⏳');

    const media = await q.download();
    const { ext } = await fileTypeFromBuffer(media);

    const form = new FormData();
    form.append('fileToUpload', media, `file.${ext}`);
    form.append('reqtype', 'fileupload');

    const uploadRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });

    const imageUrl = await uploadRes.text();
    if (!imageUrl.startsWith('https://')) {
      throw new Error("Failed to upload image to Catbox");
    }

    const apiUrl = `https://mr-obito-api.vercel.app/api/tools/flag-morocco?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

    const filePath = `./flag_morocco_${Date.now()}.png`;
    fs.writeFileSync(filePath, response.data);

    await conn.sendMessage(
      m.chat,
      { image: fs.readFileSync(filePath), caption: "Image generated successfully 🧞" },
      { quoted: m }
    );

    fs.unlinkSync(filePath);
    await m.react('✅');
  } catch (err) {
    console.error("Error:", err);
    await m.reply("An error occurred while processing the image. Make sure you replied to a valid image.");
    await m.react('❌');
  }
};

handler.help = ["maroc-flag"];
handler.tags = ["morocco"];
handler.command = /^maroc-flag$/i;

export default handler;
