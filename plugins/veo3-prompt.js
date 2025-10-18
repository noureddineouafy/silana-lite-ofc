// instagram.com/noureddine_ouafy
// scrape by malik 
import axios from "axios";

class GeminiService {
  constructor(customKey = null) {
    this.config = {
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.0-flash-lite",
      endpoint: "/models/{model}:generateContent",
      generation: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
      retry: {
        maxAttempts: 3,
        delayMs: 1000,
      },
    };
    this.keys = [
      "QUl6YVN5Qy04V01Fd0V1NGcxWXB0M3BaaWw5NWswUEJrVUtWcjBz",
      "QUl6YVN5RGdDMVpwQnY3eXhMT3dLejBXYUhJM2NTaTlsUUJ2QXNZ",
      "QUl6YVN5RFJud01ZMU5GalZJSFhJU05sZnFBU040THIyckozVE9v",
      "QUl6YVN5REw5YTRDSm9icEQ4a0ttM1d3LXlBV0lvajZhbWgzMzA0",
      "QUl6YVN5Q29aZGRwSXk5TFU1Vm9uTUc1djYwRl8zaE5KeUpja3JR",
    ];
    this.idx = 0;
    this.custKey = customKey;
  }

  getActiveKey() {
    const keyIndex = this.custKey ? null : this.idx % this.keys.length;
    const encodedKey = this.custKey || this.keys[keyIndex];
    const decodedKey = Buffer.from(encodedKey, "base64").toString("utf-8");
    if (!this.custKey && keyIndex !== null) {
      this.idx = (this.idx + 1) % this.keys.length;
    }
    return decodedKey;
  }

  buildUrl() {
    return `${this.config.baseUrl}${this.config.endpoint.replace("{model}", this.config.model)}`;
  }

  async generate(params = {}) {
    try {
      const key = this.getActiveKey();
      const url = `${this.buildUrl()}?key=${key}`;
      const response = await axios.post(url, {
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt || "Generate a creative video idea." }],
          },
        ],
        generationConfig: this.config.generation,
      });
      const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No result generated.";
      return { result };
    } catch (e) {
      return { error: e.message };
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply("🔍 Please provide a prompt after the command.\nExample: *.veo3-prompt create a video about Morocco sunset*");
  }

  const gemini = new GeminiService();
  const result = await gemini.generate({ prompt: text });

  if (result.error) {
    return m.reply(`❌ Error: ${result.error}`);
  }

  await m.reply(`✨ *Gemini Prompt Result:*\n\n${result.result}`);
};

handler.help = handler.command = ["veo3-prompt"];
handler.tags = ["tools"];
handler.limit = true;

export default handler;
