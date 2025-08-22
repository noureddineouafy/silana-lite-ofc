// plugin by noureddine ouafy 
// scrape by daffa channel 
// author gienetic

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// --- Translation Function ---
async function translateToEnglish(text) {
  try {
    const url = "https://translate.googleapis.com/translate_a/single";
    const params = { client: "gtx", sl: "auto", tl: "en", dt: "t", q: text };
    const res = await axios.get(url, { params });
    return res.data[0].map(item => item[0]).join('');
  } catch (err) {
    console.error("Translate Error:", err.message);
    return text;
  }
}

// --- Text2Image ---
async function creartTxt2Img(prompt) {
  try {
    const translatedPrompt = await translateToEnglish(prompt);
    const form = new FormData();
    form.append("prompt", translatedPrompt);
    form.append("input_image_type", "text2image");
    form.append("aspect_ratio", "4x5");

    const response = await axios.post(
      "https://api.creartai.com/api/v2/text2image",
      form,
      { headers: form.getHeaders(), responseType: "arraybuffer" }
    );
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error("❌ Failed to create image (txt2img): " + (err?.response?.data?.message || err.message));
  }
}

// --- Image2Image ---
async function creartImg2Img(prompt, imageBuffer) {
  let tempImagePath = '';
  try {
    const translatedPrompt = await translateToEnglish(prompt);
    tempImagePath = join(tmpdir(), `${Date.now()}.jpg`);
    await fs.promises.writeFile(tempImagePath, imageBuffer);

    const form = new FormData();
    form.append("prompt", translatedPrompt);
    form.append("input_image_type", "image2image");
    form.append("aspect_ratio", "4x5");
    form.append("image_file", fs.createReadStream(tempImagePath));

    const response = await axios.post(
      "https://api.creartai.com/api/v2/image2image",
      form,
      { headers: form.getHeaders(), responseType: "arraybuffer" }
    );
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error("❌ Failed to create image (img2img): " + (err?.response?.data?.message || err.message));
  } finally {
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      await fs.promises.unlink(tempImagePath);
    }
  }
}

// --- Handler ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(
      `Please provide a prompt.\n\n*Usage Examples:*\n` +
      `1. *Text-to-Image*: ${usedPrefix + command} a majestic lion in the savanna\n` +
      `2. *Image-to-Image*: Reply to an image with *${usedPrefix + command} make it a watercolor painting*`
    );
  }

  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';
  
  try {
    if (/image/g.test(mime)) {
      await m.reply('🎨 Processing your image with the new prompt, please wait...');
      const imageBuffer = await quoted.download();
      const resultBuffer = await creartImg2Img(text, imageBuffer);

      await conn.sendMessage(m.chat, {
        image: resultBuffer,
        caption: `*Prompt:* ${text}`
      }, { quoted: m });

    } else {
      await m.reply('🎨 Generating your image from text, please wait...');
      const resultBuffer = await creartTxt2Img(text);

      await conn.sendMessage(m.chat, {
        image: resultBuffer,
        caption: `*Prompt:* ${text}`
      }, { quoted: m });
    }
  } catch (e) {
    console.error(e);
    m.reply(e.message);
  }
};

handler.help = ['create-art'];
handler.command = ['create-art'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
