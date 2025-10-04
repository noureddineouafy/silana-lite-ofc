/**
 * ElevenLabs TTS Plugin
 * Usage: .elevenlab2 <text>
 * plugin: Noureddine ouafy
 * scrape by andhikagg
 */

import axios from "axios";
import crypto from "crypto";

class ElevenLabs {
  constructor() {
    this.ins = axios.create({
      baseURL: "https://tts1.squinty.art/api/v1",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "user-agent": "NX/1.0.0",
      },
    });
  }

  genLogin() {
    const randHex = (l) => crypto.randomUUID().replace(/-/g, "").slice(0, l),
      randNum = (d) => String(Math.floor(Math.random() * 10 ** d)).padStart(d, "0"),
      getRand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
      b = getRand(0, 4);

    const [devices, country, lang, zone, ...nn] = [
      [
        "Samsung Galaxy S25 Ultra",
        "Google Pixel 10",
        "OnePlus 13",
        "Xiaomi 15 Ultra",
        "Oppo Find X8 Pro",
      ],
      ["ID", "VN", "PH", "MM", "JP"],
      ["id", "vi", "en", "my", "jp"],
      [
        "Asia/Jakarta",
        "Asia/Ho_Chi_Minh",
        "Asia/Manila",
        "Asia/Yangon",
        "Asia/Tokyo",
      ],
      ["Hiro", "Yuki", "Sora", "Riku", "Kaito"],
      ["Tanaka", "Sato", "Nakamura", "Kobayashi", "Yamamoto"],
    ],
      [fn, ln] = nn.map((z) => z[Math.floor(Math.random() * z.length)]);

    return {
      build: "14",
      country: country[b],
      deviceId: randHex(16),
      deviceModel: `${devices[getRand(0, devices.length - 1)]}`,
      displayName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}${randNum(4)}${randHex(4)}@gmail.com`,
      googleAccountId: randNum(18),
      language: lang[b],
      osVersion: String(26 + Math.floor(Math.random() * 4)),
      platform: "android",
      timeZone: zone[b],
      version: "1.1.4",
    };
  }

  async login() {
    const z = await this.ins.post("/login/login", this.genLogin());
    this.ins.defaults.headers.common.authorization = "Bearer " + z.data.token;
  }

  async create(f = {}) {
    return this.ins
      .post("/generate/generate", {
        text: f.text || "hello",
        voiceId: f.id || "2EiwWnXFnvU5JabPnv8n",
        modelId: f.model || "eleven_turbo_v2_5",
        styleExaggeration: f.exaggeration || "50",
        claritySimilarityBoost: f.clarity || "50",
        stability: f.stability || "50",
      })
      .then((i) => i.data);
  }
}

// ----- WhatsApp handler -----
let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Please provide text to generate TTS.\nUsage: .elevenlab2 <text>");

  try {
    const eleven = new ElevenLabs();
    await eleven.login();

    const data = await eleven.create({ text });
    if (data?.url) {
      conn.sendFile(m.chat, data.url, "tts.mp3", null, m);
    } else {
      m.reply("Failed to generate TTS. Try again.");
    }
  } catch (err) {
    console.error(err);
    m.reply("An error occurred while generating TTS.");
  }
};

handler.help = handler.command = ["elevenlab2"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
