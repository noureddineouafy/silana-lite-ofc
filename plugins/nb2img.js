// plugin by noureddine ouafy
// scrape by malik

import axios from "axios";
import FormData from "form-data";

class NanoBanana {
  constructor() {
    this.url = "https://api.pixq.top/api";
    this.ua = "okhttp/4.11.0";
    this.pd = 3000;
    this.pm = 60000;
    this.ax = axios.create({ baseURL: this.url });
  }

  async generate({ prompt, image, ...rest }) {
    const type = image ? "i2i" : "t2i";
    const id = await this[type]({ prompt, image, ...rest });
    const res = await this.poll(id, type);
    return res;
  }

  async t2i({ prompt, num = 1, model = "nano-banana", fmt = "png", ar = "3:4", style = "", append = "", ...rest }) {
    const data = { prompt, model, num_outputs: num, output_format: fmt, aspect_ratio: ar, style, append, ...rest };
    const res = await this.ax.post("/generate", data, { headers: { "User-Agent": this.ua } });
    if (!res.data?.status) throw new Error("API error on generate");
    return res.data?.id;
  }

  async i2i({ prompt = "", image, num = 1, ar = "1:1", device_id = "1", is_paid = "true", ...rest }) {
    const imgs = Array.isArray(image) ? image : [image];
    const form = new FormData();
    for (let i = 0; i < imgs.length; i++) {
      const buf = await this.buf(imgs[i]);
      form.append("images[]", buf, { filename: `img_${i}.jpg` });
    }
    form.append("prompt", prompt);
    form.append("aspect_ratio", ar);
    form.append("device_id", device_id);
    form.append("is_paid", is_paid);
    Object.entries(rest).forEach(([k, v]) => form.append(k, String(v)));
    const res = await this.ax.post("/nano-banana/chat", form, {
      headers: { ...form.getHeaders(), "User-Agent": this.ua }
    });
    if (!res.data?.status) throw new Error("API error on image-to-image");
    return res.data?.id;
  }

  async buf(src) {
    if (Buffer.isBuffer(src)) return src;
    if (typeof src !== "string") throw new Error("Invalid image type");
    if (src.startsWith("data:")) return Buffer.from(src.split(",")[1], "base64");
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await axios.get(src, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/*,*/*;q=0.8",
          Referer: new URL(src).origin
        }
      });
      return Buffer.from(res.data);
    }
    throw new Error("Unknown image format");
  }

  async poll(id, type = "t2i") {
    const ep = type === "i2i" ? "/get-chat-results" : "/get-results";
    const start = Date.now();
    while (true) {
      const res = await this.ax.post(ep, { id }, {
        headers: { "User-Agent": this.ua },
        timeout: 30000
      });
      if (res.data?.status && res.data?.data?.length) return res.data.data;
      if (Date.now() - start > this.pm) throw new Error("Polling timeout — server took too long");
      await new Promise(r => setTimeout(r, this.pd));
    }
  }
}

// ─────────────────────────────────────────────
//  GUIDE CARD (English)
// ─────────────────────────────────────────────
const GUIDE = `
╔════════════════════════════════════╗
║       🍌 NanoBanana AI Image      ║
╠════════════════════════════════════╣
║                                    ║
║  TWO MODES AVAILABLE:              ║
║                                    ║
║  1️⃣  .nb <prompt>                 ║
║  Generate a new image from text.   ║
║                                    ║
║  Examples:                         ║
║  .nb a wolf in a neon city         ║
║  .nb anime girl under cherry tree  ║
║  .nb futuristic car on a highway   ║
║                                    ║
║  2️⃣  .nb2img <instruction>        ║
║  Transform an existing image.      ║
║  → Reply to an image with this     ║
║                                    ║
║  Examples:                         ║
║  .nb2img turn into anime style     ║
║  .nb2img make it look like a       ║
║  watercolor painting               ║
║                                    ║
║  ⚠️  TIPS:                         ║
║  • English prompts work best       ║
║  • Be specific and detailed        ║
║  • Processing takes ~15-30s        ║
║  • Each use costs 1 limit point    ║
║                                    ║
╚════════════════════════════════════╝
`.trim();

// ─────────────────────────────────────────────
//  HANDLER
// ─────────────────────────────────────────────
let handler = async (m, { conn, command, text }) => {

  // Show guide if no arguments given
  if (!text) {
    return conn.sendMessage(m.chat, { text: GUIDE }, { quoted: m });
  }

  const isImg2Img = command === "nb2img";

  // Validate image reply for i2i mode
  let imageBuffer = null;
  if (isImg2Img) {
    const quoted = m.quoted || m;
    const mime = (quoted.msg || quoted)?.mimetype || "";
    if (!mime.startsWith("image/")) {
      return conn.sendMessage(
        m.chat,
        { text: "⚠️ *.nb2img* requires you to *reply to an image* with your instruction.\n\nExample:\n_Reply to an image → .nb2img turn into anime style_" },
        { quoted: m }
      );
    }
    imageBuffer = await quoted.download();
  }

  // Processing notice
  await conn.sendMessage(
    m.chat,
    { text: `🍌 *${isImg2Img ? "Transforming image" : "Generating image"}...*\n\n📝 Prompt: _${text}_\n\n⏳ Please wait (~15-30 seconds)` },
    { quoted: m }
  );

  try {
    const api = new NanoBanana();
    const results = await api.generate({
      prompt: text,
      ...(imageBuffer ? { image: imageBuffer } : {})
    });

    // results is an array of image URLs
    for (const imgUrl of results) {
      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
      const imgBuffer = Buffer.from(imgRes.data);
      await conn.sendMessage(
        m.chat,
        {
          image: imgBuffer,
          caption: `✅ *Done!*\n📝 Prompt: _${text}_\n🍌 Powered by NanoBanana`
        },
        { quoted: m }
      );
    }
  } catch (err) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ *Failed:* ${err.message}\n\nTry again with a different prompt.` },
      { quoted: m }
    );
  }
};

handler.help = handler.command = ["nb", "nb2img"];
handler.tags = ["editor"];
handler.limit = true;
export default handler;
