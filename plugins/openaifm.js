// instagram.com/noureddine_ouafy
// scrape by malik

import axios from "axios";
import { randomUUID } from "crypto";

class OpenAiFM {
  constructor() {
    this.voices = ["Alloy", "Ash", "Ballad", "Coral", "Echo", "Fable", "Onyx", "Nova", "Sage", "Shimmer", "Verse"];
    this.vibes = ["Santa", "True Crime Buff", "Old-Timey", "Robot", "Eternal Optimist"];
    this.apiBase = "https://www.openai.fm/api/generate";
    this.defaultPrompt = {
      identity: "Pembicara yang profesional",
      affect: "Berwibawa dan ramah",
      tone: "Profesional dan mudah dimengerti",
      emotion: "Percaya diri dan menginspirasi",
      pronunciation: "Jelas dan tegas",
      pause: "Jeda strategis untuk penekanan"
    };
  }

  isValid(input, prompt) {
    if (!input?.trim()) return "Input tidak boleh kosong";
    const required = Object.keys(this.defaultPrompt);
    const missing = required.filter(p => !prompt?.[p]);
    return missing.length ? `Prompts ${missing.join(", ")} harus diisi` : null;
  }

  buildPrompt(customPrompt = {}) {
    try {
      const final = {
        ...this.defaultPrompt,
        ...customPrompt
      };
      return Object.entries(final).map(([key, value]) => `${key}: ${value}`).join("\n");
    } catch (err) {
      console.error("buildPrompt error:", err.message);
      return Object.entries(this.defaultPrompt).map(([k, v]) => `${k}: ${v}`).join("\n");
    }
  }

  async generate({
    text = "",
    prompt = {},
    voice = "Coral",
    vibe = "Santa",
    generation = null
  } = {}) {
    const startTime = Date.now();
    const genId = generation || randomUUID();
    
    // Merge defaults here to prevent validation error
    const effectivePrompt = { ...this.defaultPrompt, ...prompt };

    try {
      const validationError = this.isValid(text, effectivePrompt);
      if (validationError) return { success: false, error: validationError };
      
      // Case insensitive check
      const validVoice = this.voices.find(v => v.toLowerCase() === voice.toLowerCase());
      if (!validVoice) {
        return { success: false, error: `Voice '${voice}' tidak valid.\nList: ${this.voices.join(", ")}` };
      }
      
      // Use the correct casing from the list
      voice = validVoice;

    } catch (err) {
      return { success: false, error: "Validasi internal error" };
    }

    try {
      const params = new URLSearchParams();
      params.append("input", text);
      params.append("prompt", this.buildPrompt(prompt));
      params.append("voice", voice.toLowerCase());
      params.append("vibe", vibe);
      params.append("generation", genId);

      const url = `${this.apiBase}?${params.toString()}`;
      
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
          Referer: "https://www.openai.fm/",
        }
      });

      return {
        success: true,
        buffer: Buffer.from(response.data),
        filename: `tts-${genId}.mp3`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || "Server Error"
      };
    }
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*Usage Examples:*\n\n1. Default:\n${usedPrefix + command} Hello World\n\n2. Specific Voice:\n${usedPrefix + command} Alloy | Hello World\n\n3. Voice & Vibe:\n${usedPrefix + command} Onyx | Robot | Hello World\n\n*Available Voices:* Alloy, Ash, Ballad, Coral, Echo, Fable, Onyx, Nova, Sage, Shimmer, Verse`;

    const api = new OpenAiFM();
    
    // Parsing Logic: text | vibe | voice
    let [arg1, arg2, arg3] = text.split('|').map(v => v.trim());
    
    let inputVoice = "Coral";
    let inputVibe = "Santa";
    let inputText = arg1;

    // If user uses "|" separator
    if (arg2 && !arg3) {
        // Format: Voice | Text
        inputVoice = arg1;
        inputText = arg2;
    } else if (arg3) {
        // Format: Voice | Vibe | Text
        inputVoice = arg1;
        inputVibe = arg2;
        inputText = arg3;
    }

    await m.react('⏳');

    try {
        const result = await api.generate({ 
            text: inputText,
            voice: inputVoice, 
            vibe: inputVibe
        });

        if (!result.success) {
            await m.react('❌');
            throw result.error;
        }

        await conn.sendMessage(m.chat, { 
            audio: result.buffer, 
            mimetype: 'audio/mpeg', 
            ptt: true,
            caption: `🎙️ *Voice:* ${inputVoice}\n🎭 *Vibe:* ${inputVibe}`
        }, { quoted: m });
        
        await m.react('✅');

    } catch (e) {
        throw e;
    }
}

handler.help = ['openaifm'];
handler.tags = ['ai'];
handler.command = /^(openaifm)$/i;
handler.limit = true;

export default handler;
