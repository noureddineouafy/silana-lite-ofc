
import axios from "axios";
import crypto from "crypto";

class TurnstileSolver {
  constructor() {
    this.solverURL = "https://cf-solver-renofc.my.id/api/solvebeta";
  }

  async solve(url, siteKey, mode = "turnstile-min") {
    const response = await axios.post(this.solverURL, { url, siteKey, mode }, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data.token.result.token;
  }
}

class AIBanana {
  constructor() {
    this.baseURL = "https://aibanana.net";
    this.siteKey = "0x4AAAAAAB2-fh9F_EBQqG2_";
    this.solver = new TurnstileSolver();
  }

  generateFingerprint() {
    return crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex");
  }

  generateDeviceId() {
    return crypto.randomBytes(8).toString("hex");
  }

  generateRandomUserAgent() {
    const osList = [
      "Windows NT 10.0; Win64; x64",
      "Macintosh; Intel Mac OS X 10_15_7",
      "X11; Linux x86_64"
    ];
    const os = osList[Math.floor(Math.random() * osList.length)];
    const v = Math.floor(Math.random() * 40) + 100;
    return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`;
  }

  generateRandomViewport() {
    const res = [
      { w: 1366, h: 768 }, { w: 1920, h: 1080 }, { w: 1440, h: 900 },
      { w: 1536, h: 864 }, { w: 1280, h: 720 }
    ];
    return res[Math.floor(Math.random() * res.length)];
  }

  generateRandomPlatform() {
    return ["Windows", "Linux", "macOS", "Chrome OS"][Math.floor(Math.random() * 4)];
  }

  generateRandomLanguage() {
    return ["en-US,en;q=0.9", "id-ID,id;q=0.9,en-US;q=0.8", "en-GB,en;q=0.9"][Math.floor(Math.random() * 3)];
  }

  async generateImage(prompt) {
    const turnstileToken = await this.solver.solve(this.baseURL, this.siteKey, "turnstile-min");
    const fingerprint = this.generateFingerprint();
    const deviceId = this.generateDeviceId();
    const userAgent = this.generateRandomUserAgent();
    const viewport = this.generateRandomViewport();
    const platform = this.generateRandomPlatform();
    const language = this.generateRandomLanguage();
    const chromeVersion = Math.floor(Math.random() * 30) + 110;

    const response = await axios.post(`${this.baseURL}/api/image-generation`, {
      prompt,
      model: "nano-banana-2",
      mode: "text-to-image",
      numImages: 1,
      aspectRatio: "1:1",
      clientFingerprint: fingerprint,
      turnstileToken,
      deviceId
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Accept-Language": language,
        "Origin": this.baseURL,
        "Referer": `${this.baseURL}/`,
        "User-Agent": userAgent,
        "Sec-Ch-Ua": `"Chromium";v="${chromeVersion}", "Not-A.Brand";v="24", "Google Chrome";v="${chromeVersion}"`,
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": `"${platform}"`,
        "Viewport-Width": viewport.w.toString(),
        "Viewport-Height": viewport.h.toString(),
        "X-Forwarded-For": `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    return response.data;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat,
      `╭─「 🍌 *AI Banana Image Generator* 」\n` +
      `│\n` +
      `│ Generate AI images from text prompts\n` +
      `│ using the AIBanana (nano-banana-2) model.\n` +
      `│\n` +
      `│ *Usage:*\n` +
      `│ .${command} <your prompt>\n` +
      `│\n` +
      `│ *Examples:*\n` +
      `│ .${command} a dragon in the mountains\n` +
      `│ .${command} futuristic city at night\n` +
      `│ .${command} cute cat sitting on a cloud\n` +
      `│\n` +
      `│ ⚠️ Please be patient, image generation\n` +
      `│ may take a few seconds.\n` +
      `╰────────────────────────────`,
      m
    );
  }

  await conn.reply(m.chat, `🍌 Generating image for: *${text}*\nPlease wait...`, m);

  try {
    const banana = new AIBanana();
    const result = await banana.generateImage(text);

    // Try to extract image URL from common response shapes
    const imageUrl =
      result?.images?.[0]?.url ||
      result?.data?.[0]?.url ||
      result?.url ||
      result?.image ||
      result?.result?.url ||
      null;

    if (!imageUrl) {
      console.error("[aibanana] Unexpected response:", JSON.stringify(result, null, 2));
      return conn.reply(m.chat, `❌ Failed to get image URL. The API may have changed its response format.`, m);
    }

    await conn.sendFile(m.chat, imageUrl, "aibanana.jpg", `✅ *Prompt:* ${text}`, m);

  } catch (err) {
    console.error("[aibanana] Error:", err.message);
    conn.reply(m.chat, `❌ Error: ${err.message}`, m);
  }
};

handler.help = handler.command = ["aibanana"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
