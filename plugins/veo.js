// plugin by noureddine ouafy 
// scrape by malik 

import axios from "axios";
import FormData from "form-data";

// Helper function for creating delays in the polling loop
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AiLabs Class
 * Manages all API interactions for video generation.
 */
class AiLabs {
  constructor() {
    this.api = {
      base: "https://text2video.aritek.app",
      endpoints: {
        generate: "/txt2videov3",
        video: "/video" // This is the status check endpoint
      }
    };
    this.headers = {
      "user-agent": "NB Android/1.0.0",
      "accept-encoding": "gzip",
      "content-type": "application/json",
      authorization: ""
    };
    this.state = {
      token: null
    };
    this.setup = {
      cipher: "hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW",
      shiftValue: 3
    };
  }

  dec(text, shift) {
    return [...text].map(c => /[a-z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97) : /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65) : c).join("");
  }

  async decrypt() {
    if (this.state.token) return this.state.token;
    const input = this.setup.cipher;
    const shift = this.setup.shiftValue;
    const decrypted = this.dec(input, shift);
    this.state.token = decrypted;
    this.headers.authorization = decrypted;
    return decrypted;
  }

  deviceId() {
    return Array.from({
      length: 16
    }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }

  async txt2vid({
    prompt,
    isPremium = 1
  }) {
    try {
      if (!prompt?.trim()) return {
        success: false,
        error: "Prompt cannot be empty"
      };
      if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(prompt)) return {
        success: false,
        error: "Prompt contains invalid characters"
      };
      await this.decrypt();
      const payload = {
        deviceID: this.deviceId(),
        isPremium: isPremium,
        prompt: prompt,
        used: [],
        versionCode: 59
      };
      const url = this.api.base + this.api.endpoints.generate;
      const response = await axios.post(url, payload, {
        headers: this.headers
      });
      const {
        code,
        key
      } = response.data;
      if (code !== 0 || !key) return {
        success: false,
        error: "Failed to get video generation key"
      };
      return {
        success: true,
        data: {
          task_id: key
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "An unknown error occurred"
      };
    }
  }

  async status({
    task_id
  }) {
    try {
      if (!task_id) return {
        success: false,
        error: "Invalid task_id provided"
      };
      await this.decrypt();
      const payload = {
        keys: [task_id]
      };
      const url = this.api.base + this.api.endpoints.video;
      const response = await axios.post(url, payload, {
        headers: this.headers,
        timeout: 20000
      });
      const {
        code,
        datas
      } = response.data;
      if (code === 0 && Array.isArray(datas) && datas.length > 0) {
        const data = datas[0];
        if (data.url && data.url.trim() !== "") {
          return {
            success: true,
            data: {
              status: "completed",
              url: data.url.trim(),
              progress: "100%"
            }
          };
        }
        const progress = parseFloat(data.progress || 0);
        return {
          success: true,
          data: {
            status: "processing",
            progress: `${Math.round(progress)}%`
          }
        };
      }
      return {
        success: false,
        error: "Invalid response from server"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Status check failed"
      };
    }
  }
}

/**
 * WhatsApp Bot Handler for 'veo' command
 */
let handler = async (m, {
  conn,
  command,
  text
}) => {
  if (!text) throw `Please provide a prompt to generate a video.\n\n*Example:* .${command} a futuristic city at sunset`;

  const ai = new AiLabs();

  await m.reply("🎬 Starting video generation... This process can take several minutes. Please be patient.");

  const initialTask = await ai.txt2vid({
    prompt: text
  });

  if (!initialTask.success) {
    return await m.reply(`❌ Failed to start video generation.\n*Reason:* ${initialTask.error}`);
  }

  const taskId = initialTask.data.task_id;
  let lastProgress = "";

  // Poll for the result up to 60 times (approx 10 minutes)
  for (let i = 0; i < 60; i++) {
    await delay(10000); // Wait 10 seconds between checks
    const statusResult = await ai.status({
      task_id: taskId
    });

    if (!statusResult.success) {
      // Stop polling if a non-recoverable error occurs
      await m.reply(`⚠️ Error checking status: ${statusResult.error}. Aborting.`);
      return;
    }

    if (statusResult.data.status === 'completed') {
      await m.reply("✅ Video generation complete!");
      await conn.sendFile(m.chat, statusResult.data.url, 'video.mp4', `*Prompt:* ${text}`, m);
      return;
    }

    // Send progress updates only when the percentage changes
    if (statusResult.data.progress !== lastProgress) {
      lastProgress = statusResult.data.progress;
      await m.reply(`⏳ Processing video... *${lastProgress}*`);
    }
  }

  await m.reply("⏰ Video generation timed out. The server may still be processing your request, but the bot will no longer check for updates.");
};

// Plugin metadata
handler.help = ['veo'];
handler.command = ['veo'];
handler.tags = ['ai'];
handler.limit = true; // Apply usage limits if your bot has them

export default handler;
