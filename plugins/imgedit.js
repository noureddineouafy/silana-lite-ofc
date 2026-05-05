// plugin by noureddine ouafy
// scrape by Malik

import axios from "axios";

class AiImageEdit {
  constructor() {
    this.base = "https://dydkrpmnafsnivjxmipj.supabase.co";
    this.key = "sb_publishable_W_1Ofv9769iYEEn9dfyAHQ_OhuCER6g";
    this.sess = {};
    this.head = {
      "User-Agent": "Dart/3.9 (dart:io)",
      "Accept-Encoding": "gzip",
      "x-supabase-client-platform": "android",
      "x-client-info": "supabase-flutter/2.10.3",
      "Content-Type": "application/json; charset=utf-8",
      apikey: this.key,
      "x-supabase-api-version": "2024-01-01"
    };
  }

  async solve(img) {
    try {
      if (Buffer.isBuffer(img)) return img.toString("base64");
      if (typeof img === "string" && img.startsWith("http")) {
        const res = await axios.get(img, {
          responseType: "arraybuffer",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            Referer: new URL(img).origin
          }
        });
        return Buffer.from(res.data).toString("base64");
      }
      return img;
    } catch (e) {
      return null;
    }
  }

  async auth() {
    try {
      const url = `${this.base}/auth/v1/signup`;
      const payload = { data: {}, gotrue_meta_security: { captcha_token: null } };
      const headers = { ...this.head, Authorization: `Bearer ${this.key}` };
      const { data } = await axios.post(url, payload, { headers });
      this.sess.token = data?.access_token || null;
      this.sess.refresh = data?.refresh_token || null;
      return this.sess.token;
    } catch (e) {
      return null;
    }
  }

  async generate({ prompt, image }) {
    try {
      const token = this.sess.token || await this.auth();
      if (!token) throw new Error("Authentication failed");

      const imgData = await this.solve(image);
      if (!imgData) throw new Error("Failed to process image");

      const payload = {
        image: imgData,
        mimeType: "image/png",
        prompt,
        model: "auto",
        isFirstAttempt: true
      };

      const { data } = await axios.post(`${this.base}/functions/v1/edit-image`, payload, {
        headers: { ...this.head, Authorization: `Bearer ${token}` }
      });

      const b64Res = data?.image;
      if (!b64Res) throw new Error("No image data returned from API");

      return {
        buffer: Buffer.from(b64Res, "base64"),
        contentType: "image/png",
        meta: { prompt: data?.prompt || prompt, model: data?.model }
      };
    } catch (e) {
      throw new Error(e.response?.data?.msg || e.message);
    }
  }
}

// ─────────────────────────────────────────────
//  GUIDE CARD (English)
// ─────────────────────────────────────────────
const GUIDE = `
╔══════════════════════════════════╗
║      🖼️ AI Image Editor         ║
╠══════════════════════════════════╣
║                                  ║
║  Edit any image using AI with    ║
║  a simple text instruction.      ║
║                                  ║
║  HOW TO USE:                     ║
║  1. Send or find any image       ║
║  2. Reply to that image with:    ║
║     .imgedit <your instruction>  ║
║                                  ║
║  EXAMPLES:                       ║
║  .imgedit remove the background  ║
║  .imgedit make the sky purple    ║
║  .imgedit add a rainbow          ║
║  .imgedit turn it into anime     ║
║  .imgedit make it look vintage   ║
║                                  ║
║  ⚠️  TIPS:                       ║
║  • Always reply to an image      ║
║  • Be specific in your prompt    ║
║  • English prompts work best     ║
║  • Processing may take ~10s      ║
║  • Each use costs 1 limit point  ║
║                                  ║
╚══════════════════════════════════╝
`.trim();

// ─────────────────────────────────────────────
//  HANDLER
// ─────────────────────────────────────────────
let handler = async (m, { conn, text }) => {

  // Show guide if no arguments given
  if (!text) {
    return conn.sendMessage(m.chat, { text: GUIDE }, { quoted: m });
  }

  // Must reply to an image
  const quoted = m.quoted || m;
  const mime = (quoted.msg || quoted)?.mimetype || "";
  if (!mime.startsWith("image/")) {
    return conn.sendMessage(
      m.chat,
      { text: "⚠️ *Image Edit:* Please *reply to an image* with your edit instruction.\n\nExample:\n_.imgedit make the background black and white_" },
      { quoted: m }
    );
  }

  const imageBuffer = await quoted.download();

  // Send processing notice
  await conn.sendMessage(
    m.chat,
    { text: `🖼️ *Editing your image...*\n\n📝 Prompt: _${text}_\n\n⏳ Please wait (~10 seconds)` },
    { quoted: m }
  );

  try {
    const api = new AiImageEdit();
    const result = await api.generate({ prompt: text, image: imageBuffer });

    await conn.sendMessage(
      m.chat,
      {
        image: result.buffer,
        caption: `✅ *Done!*\n📝 Prompt: _${text}_\n🤖 Model: \`${result.meta?.model || "auto"}\``
      },
      { quoted: m }
    );
  } catch (err) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ *Failed:* ${err.message}\n\nTry again with a different prompt.` },
      { quoted: m }
    );
  }
};

handler.help = handler.command = ["imgedit"];
handler.tags = ["editor"];
handler.limit = true;
export default handler;
