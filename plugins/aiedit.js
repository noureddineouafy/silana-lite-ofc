// plugin by noureddine ouafy 
// scrape by gilang1612

import axios from 'axios';
import CryptoJS from 'crypto-js';

const AES_KEY = "ai-enhancer-web__aes-key";
const AES_IV = "aienhancer-aesiv";

function encryptSettings(settings) {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);
  return CryptoJS.AES.encrypt(
    JSON.stringify(settings),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  ).toString();
}

async function createTask(base64Image, promptText) {
  const settings = {
    aspect_ratio: "match_input_image",
    output_format: "jpg",
    prompt: promptText
  };

  const payload = {
    model: 2,
    image: [base64Image],
    function: 'ai-image-editor',
    settings: encryptSettings(settings)
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 16; ASUS_AI2401_A Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Origin': 'https://aienhancer.ai',
    'Referer': 'https://aienhancer.ai/ai-image-editor',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'mark.via.gp'
  };

  const res = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create', payload, { headers, timeout: 30000 });
  if (res.data.code !== 100000) throw new Error(res.data.message);
  return res.data.data.id;
}

async function pollResult(taskId, interval = 3000, timeout = 90000) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 16; ASUS_AI2401_A Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Origin': 'https://aienhancer.ai',
    'Referer': 'https://aienhancer.ai/ai-image-editor',
    'x-requested-with': 'mark.via.gp'
  };

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result', { task_id: taskId }, { headers });
    if (res.data.code !== 100000) throw new Error(res.data.message);
    const task = res.data.data;
    if (task.status === 'succeeded') return task.output;
    if (task.status === 'failed') throw new Error(task.error || 'Task failed');
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Timed out waiting for result');
}

let handler = async (m, { conn }) => {
  // --- Detect image source: quoted OR sent with caption ---
  const quoted = m.quoted;
  const quotedMsg = quoted?.msg || quoted;
  const quotedMime = quotedMsg?.mimetype || '';
  const hasQuotedImage = /image\/(jpeg|png|webp)/.test(quotedMime);

  // Check if the user sent the image directly with the command as caption
  const selfMsg = m.message?.imageMessage;
  const selfMime = selfMsg?.mimetype || '';
  const hasSelfImage = /image\/(jpeg|png|webp)/.test(selfMime);

  const hasImage = hasQuotedImage || hasSelfImage;

  // --- Show guide if no image provided ---
  if (!hasImage) {
    return conn.sendMessage(m.chat, {
      text: `*🎨 AI Image Editor*\n\n` +
        `Edit any image using AI with a text prompt.\n\n` +
        `*How to use:*\n` +
        `1️⃣ Send an image with the command as caption:\n` +
        `   \`.aiedit <your prompt>\`\n\n` +
        `2️⃣ Or reply to an existing image with:\n` +
        `   \`.aiedit <your prompt>\`\n\n` +
        `*Examples:*\n` +
        `▸ \`.aiedit make it look like a painting\`\n` +
        `▸ \`.aiedit turn the background into a forest\`\n` +
        `▸ \`.aiedit add snow falling\`\n` +
        `▸ \`.aiedit make it cyberpunk style\`\n` +
        `▸ \`.aiedit convert to realistic photo\`\n\n` +
        `📌 *Supported formats:* JPG, PNG, WEBP\n` +
        `⏱️ Processing usually takes 10–30 seconds.`
    }, { quoted: m });
  }

  const prompt = m.text?.trim();
  if (!prompt) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ Please provide a prompt!\n\nExample: *.aiedit make it look like a painting*`
    }, { quoted: m });
  }

  await conn.sendMessage(m.chat, {
    text: `⏳ Processing your image...\n📝 Prompt: _${prompt}_`
  }, { quoted: m });

  try {
    let imgBuffer, mime;

    if (hasSelfImage) {
      // Image sent directly with caption
      mime = selfMime;
      imgBuffer = await m.download();
    } else {
      // Image from quoted message
      mime = quotedMime;
      imgBuffer = await quoted.download();
    }

    const base64Image = `data:${mime};base64,${imgBuffer.toString('base64')}`;

    const taskId = await createTask(base64Image, prompt);
    const resultUrl = await pollResult(taskId);

    await conn.sendMessage(m.chat, {
      image: { url: resultUrl },
      caption: `✅ *Done!*\n📝 Prompt: _${prompt}_`
    }, { quoted: m });

  } catch (err) {
    await conn.sendMessage(m.chat, {
      text: `❌ Failed to edit image.\n\nError: ${err.message}`
    }, { quoted: m });
  }
};

handler.help = handler.command = ['aiedit'];
handler.tags = ['editor'];
handler.limit = true;

export default handler;
