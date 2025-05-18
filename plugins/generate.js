import axios from "axios";
import * as cheerio from "cheerio";

class On4tClient {
  constructor() {
    this.cookies = "";
    this.csrfToken = "";
    this.headers = {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "id-ID,id;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "content-type": "application/x-www-form-urlencoded"
    };
    this.client = axios.create({
      withCredentials: true
    });
  }
  async initSession() {
    const url = "https://on4t.com/id/teks-ke-gambar";
    const response = await this.client.get(url, {
      headers: this.headers
    });
    const setCookies = response.headers["set-cookie"];
    this.cookies = setCookies?.map(c => c.split(";")[0]).join("; ") || "";
    const $ = cheerio.load(response.data);
    this.csrfToken = $('meta[name="csrf-token"]').attr("content") || "";
    this.headers["cookie"] = this.cookies;
    this.headers["X-CSRF-TOKEN"] = this.csrfToken;
    this.headers["origin"] = "https://on4t.com";
    this.headers["referer"] = "https://on4t.com/id/teks-ke-gambar";
  }
  async generateImage({ prompt = "Gunung dan langit biru" }) {
    await this.initSession();
    const url = "https://on4t.com/id/pembuat-gambar-ai/generate";
    const params = new URLSearchParams();
    params.append("prompt", prompt);
    let result = null;
    while (!result?.id) {
      const response = await this.client.post(url, params.toString(), {
        headers: this.headers
      });
      result = response.data;
      if (!result?.id) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return await this.waitForResult(result.id);
  }
  async waitForResult(id, maxMinutes = 1, delayMs = 2000) {
    const maxAttempts = Math.floor(maxMinutes * 60 * 1000 / delayMs);
    let attempt = 1;
    while (attempt <= maxAttempts) {
      const result = await this.pollResult(id);
      if (result?.status === "success") {
        return {
          url: `https://on4t.com${result.imageUrl}`
        };
      }
      attempt++;
      await new Promise(r => setTimeout(r, delayMs));
    }
    return null;
  }
  async pollResult(id) {
    const url = "https://on4t.com/id/pembuat-gambar-ai/fetch";
    const params = new URLSearchParams();
    params.append("id", id);
    const response = await this.client.post(url, params.toString(), {
      headers: this.headers
    });
    return response.data;
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, 'Please provide a prompt text.', m);
  try {
    const on4t = new On4tClient();
    const result = await on4t.generateImage({ prompt: text });
    if (result && result.url) {
      await conn.sendFile(m.chat, result.url, 'image.jpg', `Here is your generated image for:\n${text}`, m);
    } else {
      await conn.reply(m.chat, 'Failed to generate image. Try again later.', m);
    }
  } catch (e) {
    await conn.reply(m.chat, `Error: ${e.message}`, m);
  }
};

handler.help = ['generate'];
handler.tags = ['ai'];
handler.command = ['generate'];
handler.limit = true;
export default handler;
