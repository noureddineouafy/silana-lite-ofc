// instagram.com/noureddine_ouafy
// scrape by malik 
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

class ChatUpAI {
  constructor() {
    this.api = {
      base: "https://api.chatupai.org",
      endpoints: {
        completions: "/api/v1/completions",
        image: "/api/v1/auto-image-generate",
        browsing: "/api/v1/web-browsing",
        pdf2Text: "/api/v1/pdf-to-text"
      }
    };
    this.headers = { "User-Agent": "ChatUpAI-Client/1.3.0" };
    this.sessions = new Map();
    this.config = { maxMessages: 100, expiry: 3 * 60 * 60 * 1e3 };
  }

  generateId() {
    return crypto.randomBytes(8).toString("hex");
  }

  cleanupSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.config.expiry) {
        this.sessions.delete(id);
      }
    }
  }

  async chat({ input, sessionId = null }) {
    if (!input || typeof input !== "string") return { success: false, error: { message: "Input message cannot be empty." } };
    try {
      const isNewSession = !sessionId;
      const currentSessionId = sessionId || this.generateId();
      const previousMessages = this.sessions.get(currentSessionId)?.messages || [];
      const messages = [...previousMessages, { role: "user", content: input }];

      const response = await axios.post(`${this.api.base}${this.api.endpoints.completions}`, { messages }, { headers: this.headers });
      const content = response.data?.data?.content || "Sorry, I could not provide a response.";

      const assistantMessage = { role: "assistant", content, timestamp: Date.now() };
      const updatedMessages = [...messages, assistantMessage];

      this.sessions.set(currentSessionId, { messages: updatedMessages.slice(-this.config.maxMessages), lastActive: Date.now() });
      setTimeout(() => this.cleanupSessions(), 0);

      return { success: true, result: assistantMessage.content };
    } catch (e) {
      return { success: false, error: { message: e.message } };
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("⚠️ Please provide a message to chat with ChatUpAI.");

  const api = new ChatUpAI();
  let result = await api.chat({ input: text });

  if (result.success) {
    m.reply(result.result);
  } else {
    m.reply("❌ Error: " + (result.error?.message || "Failed to fetch response."));
  }
};

handler.help = handler.command = ["chatupai"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
