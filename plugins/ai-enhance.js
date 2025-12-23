// plugin by instagram.com/noureddine_ouafy
// scrape by malik ❤️

import axios from "axios";

class PhotoEnhancer {
  constructor() {
    this.cfg = {
      base: "https://photoenhancer.pro",
      end: {
        enhance: "/api/enhance",
        status: "/api/status",
        removeBg: "/api/remove-background",
        upscale: "/api/upscale"
      },
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: "https://photoenhancer.pro",
        referer: "https://photoenhancer.pro/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/127 Mobile"
      }
    };
  }

  wait(ms) {
    return new Promise(r => setTimeout(r, ms || 3000));
  }

  async img(input) {
    if (!input) return null;
    if (Buffer.isBuffer(input)) {
      return `data:image/jpeg;base64,${input.toString("base64")}`;
    }
    return input;
  }

  async poll(id) {
    for (let i = 0; i < 60; i++) {
      await this.wait();
      const { data } = await axios.get(
        `${this.cfg.base}${this.cfg.end.status}`,
        {
          params: { id },
          headers: this.cfg.headers
        }
      );
      if (data?.status === "succeeded") return data;
      if (data?.status === "failed") throw new Error("Processing failed");
    }
    throw new Error("Processing timeout");
  }

  async generate({ imageUrl, type }) {
    const imageData = await this.img(imageUrl);
    let endpoint = this.cfg.end.enhance;
    let body = { imageData, mode: "ultra", fileName: "image.png" };

    if (type === "remove-bg") {
      endpoint = this.cfg.end.removeBg;
      body = { imageData };
    }

    if (type === "upscale") {
      endpoint = this.cfg.end.upscale;
      body = { imageData, targetResolution: "4K" };
    }

    const init = await axios.post(
      `${this.cfg.base}${endpoint}`,
      body,
      { headers: this.cfg.headers }
    );

    if (init.data?.predictionId) {
      const final = await this.poll(init.data.predictionId);
      return final.resultUrl;
    }

    return init.data?.resultUrl;
  }
}

/* =========================
   WHATSAPP BOT HANDLER
========================= */

let handler = async (m, { conn }) => {
  if (!m.quoted || !m.quoted.mimetype?.includes("image")) {
    return m.reply(
`❌ *AI Enhance - Usage Guide*

You must reply to an image to use this feature.

📌 *How to use:*
1. Send or receive an image
2. Reply to the image
3. Type one of the commands below

✨ *Available Commands*
• .ai-enhance → Enhance image quality
• .ai-enhance bg → Remove background
• .ai-enhance upscale → Upscale image to 4K

📝 *Example*
Reply to an image and type:
.ai-enhance

⚠️ Notes:
• Processing takes 5–15 seconds
• Each use consumes bot limit
`
    );
  }

  const text = (m.text || "").toLowerCase();
  let type = "enhance";

  if (text.includes("bg")) type = "remove-bg";
  if (text.includes("upscale")) type = "upscale";

  const buffer = await m.quoted.download();
  const imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

  const api = new PhotoEnhancer();

  await m.reply("⏳ *AI is processing your image, please wait...*");

  const result = await api.generate({
    imageUrl: imageBase64,
    type
  });

  if (!result) throw "❌ Failed to process image.";

  await conn.sendMessage(
    m.chat,
    {
      image: { url: result },
      caption: "✅ *AI Enhance completed!*"
    },
    { quoted: m }
  );
};

handler.help = ["ai-enhance"];
handler.command = ["ai-enhance"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
