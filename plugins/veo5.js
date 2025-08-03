// plugin by instagram.com/noureddine_ouafy
// scrape by malik 

import axios from "axios";
import crypto from "crypto";
import CryptoJS from "crypto-js";

// You might need to find the latest password from the site's source if this stops working.
const VEO5_PASSWORD = "veo5.org";

/**
 * A class to interact with the Veo5.org video generation API.
 */
class Veo5VideoGenerator {
  constructor() {
    this.availableRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];
    // Setup encryption keys based on the password
    this.encKey = CryptoJS.enc.Utf8.parse(VEO5_PASSWORD.padEnd(32, "x"));
    this.encIV = CryptoJS.enc.Utf8.parse(VEO5_PASSWORD.padEnd(16, "x"));
  }

  enc(data) {
    const textToEncrypt = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(textToEncrypt, this.encKey, {
      iv: this.encIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  }

  dec(encryptedHex) {
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);
    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, this.encKey, {
      iv: this.encIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const json = decrypted.toString(CryptoJS.enc.Utf8);
    if (!json) throw new Error("Decryption returned empty or invalid data.");
    return JSON.parse(json);
  }

  async generate({ prompt, aspectRatio = "16:9", ...rest }) {
    if (!this.availableRatios.includes(aspectRatio)) {
      throw new Error(`Available ratios: ${this.availableRatios.join(", ")}`);
    }
    const videoId = `video_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
    const options = { prompt, aspectRatio, videoId, ...rest };
    const { data } = await axios.post("https://veo5.org/api/generate", options, {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36" }
    });
    if (!data.success) throw new Error(data.message || "Failed to initiate video generation.");
    const task_id = this.enc({ videoId: data.videoId });
    return { task_id };
  }

  async status({ task_id }) {
    const { videoId } = this.dec(task_id);
    if (!videoId) throw new Error("Invalid task_id: Missing videoId after decryption.");
    const { data } = await axios.get(`https://veo5.org/api/webhook?videoId=${videoId}`, {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36" }
    });
    if (data.status === "completed") {
      return { status: "success", videoUrl: data.videoUrl, metadata: data.metadata };
    } else if (data.status === "pending" || data.status === "processing") {
      return { status: "processing", message: "Video is still being processed." };
    } else {
      return { status: data.status, message: data.error || "Video processing failed or status is unknown." };
    }
  }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const veo5Gen = new Veo5VideoGenerator();
  const [action, ...args] = text.split(' ');
  const params = args.join(' ');

  // ✅ **الإصلاح الرئيسي هنا**: التحقق من المدخلات الفارغة أولاً
  if (!text) {
    const helpMsg = `
Please provide a prompt or an action.

*Usage Examples:*
1.  *Create a video:*
    \`${usedPrefix + command} a cat wearing sunglasses | 16:9\`

2.  *Check status:*
    \`${usedPrefix + command} status <your_task_id>\`
    `;
    return m.reply(helpMsg.trim());
  }

  try {
    if (action.toLowerCase() === 'status') {
      const taskId = params;
      if (!taskId) {
        // تم التعديل لإرسال رسالة واضحة بدلاً من رمي خطأ
        return m.reply(`Please provide a task_id to check the status.\n\n*Example:*\n${usedPrefix + command} status <task_id>`);
      }
      await m.reply(`Checking status for task_id: \`${taskId}\`...`);
      const result = await veo5Gen.status({ task_id: taskId });
      if (result.status === 'success') {
        const caption = `✅ Video is ready!\n\n*Prompt:* ${result.metadata.prompt}`;
        await conn.sendFile(m.chat, result.videoUrl, 'veo5-video.mp4', caption, m);
      } else if (result.status === 'processing') {
        await m.reply(`⏳ Your video is still processing. Please check again in a few moments.`);
      } else {
        await m.reply(`❌ An error occurred.\n*Status:* ${result.status}\n*Message:* ${result.message}`);
      }
    } else { // Default action is 'create'
      const [prompt, aspectRatio] = text.split('|').map(s => s.trim());
      await m.reply(`🚀 Starting video generation for prompt: "${prompt}"...`);
      const result = await veo5Gen.generate({ prompt, aspectRatio });
      const replyMsg = `
✅ Video generation initiated successfully!
Your *task_id* is: \`${result.task_id}\`

Use the command below to check the status and get your video:
\`${usedPrefix + command} status ${result.task_id}\`
      `.trim();
      await m.reply(replyMsg);
    }
  } catch (error) {
    console.error(error);
    // تم تعديل معالج الأخطاء ليكون أكثر أمانًا
    await m.reply(`An error occurred: ${String(error.message || error)}`);
  }
};

handler.help = ['veo5'];
handler.command = ['veo5'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
