// plugin by noureddine ouafy 
// scrape by Malik 

import axios from "axios";

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AILabs Class
 * This class handles all the direct communication with the AI video generation API.
 * The txt2img method is left in for completeness of the class, but it is not used by this handler.
 */
class AILabs {
  constructor() {
    this.api = {
      base: "https://text2pet.zdex.top",
      endpoints: {
        images: "/images",
        videos: "/videos",
        videosBatch: "/videos/batch"
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
    isPremium = 1,
    ...rest
  }) {
    if (!prompt?.trim() || !/^[a-zA-Z0-9\s.,!?'-]+$/.test(prompt)) {
      return {
        success: false,
        code: 400,
        result: {
          error: "Invalid or empty prompt"
        }
      };
    }
    await this.decrypt();
    const payload = {
      deviceID: this.deviceId(),
      isPremium: isPremium,
      prompt: prompt,
      used: [],
      versionCode: 6,
      ...rest
    };
    try {
      const url = this.api.base + this.api.endpoints.videos;
      const res = await axios.post(url, payload, {
        headers: this.headers
      });
      const {
        code,
        key
      } = res.data;
      if (code !== 0 || !key || typeof key !== "string") {
        return {
          success: false,
          code: res.status,
          result: {
            error: "Failed to get generation key"
          }
        };
      }
      return {
        success: true,
        task_id: key
      };
    } catch (err) {
      return {
        success: false,
        code: err.response?.status || 500,
        result: {
          error: err.message || "Connection error"
        }
      };
    }
  }
  async status({
    task_id: key
  }) {
    if (!key || typeof key !== "string") {
      return {
        success: false,
        code: 400,
        result: {
          error: "Invalid task_id"
        }
      };
    }
    await this.decrypt();
    const payload = {
      keys: [key]
    };
    const url = this.api.base + this.api.endpoints.videosBatch;
    try {
      const res = await axios.post(url, payload, {
        headers: this.headers,
        timeout: 15e3
      });
      const {
        code,
        datas
      } = res.data;
      if (code === 0 && Array.isArray(datas) && datas.length > 0) {
        const data = datas[0];
        if (!data.url || data.url.trim() === "") {
          const progress = parseFloat(data.progress || 0);
          return {
            success: true,
            status: "processing",
            progress: `${Math.round(progress)}%`,
          };
        }
        return {
          success: true,
          status: "completed",
          url: data.url.trim(),
        };
      }
      return {
        success: false,
        result: {
          error: "Invalid response from server"
        }
      };
    } catch (err) {
      return {
        success: false,
        result: {
          error: err.message || "Status check error"
        }
      };
    }
  }
}


// The handler for the 'veo4' command
let handler = async (m, {
  conn,
  command,
  text
}) => {
  if (!text) throw `Please provide a prompt to generate the video.\n\n*Example:* .${command} a majestic lion walking through a golden field`;

  const ai = new AILabs();

  await m.reply("🎬 Starting video generation... This process might take a few minutes. Please be patient.");

  const initialTask = await ai.txt2vid({
    prompt: text
  });

  if (!initialTask.success) {
    return await m.reply(`Failed to start video generation. Error: ${initialTask.result.error}`);
  }

  const taskId = initialTask.task_id;
  let lastProgress = "";

  // Poll for the result, checking the status periodically.
  for (let i = 0; i < 40; i++) { // Max retries: 40 times
    await delay(6000); // Wait 6 seconds between each check
    const statusResult = await ai.status({
      task_id: taskId
    });

    if (!statusResult.success) {
      await m.reply(`An error occurred while checking the video status: ${statusResult.result.error}. Aborting.`);
      return;
    }

    if (statusResult.status === 'completed') {
      await m.reply("✅ Video generation complete!");
      await conn.sendFile(m.chat, statusResult.url, 'video.mp4', `*Prompt:* ${text}`, m);
      return; // Exit the loop and function on success
    }

    // Optional: Send a progress update to the user if it has changed
    if (statusResult.status === 'processing' && statusResult.progress !== lastProgress) {
      lastProgress = statusResult.progress;
      await m.reply(`⏳ Processing video... Progress: *${lastProgress}*`);
    }
  }

  await m.reply("Video generation timed out. The server may still be processing your request, but the bot will no longer check for updates.");
};

// Handler metadata
handler.help = ['veo4'];
handler.command = ['veo4'];
handler.tags = ['ai'];
handler.limit = true; // Set to true to apply usage limits if your bot has them

export default handler;
