// plugin by noureddine ouafy
// scrape by malik

import axios from "axios";
import FormData from "form-data";

// --- Start of DailyAPI Class (Scraping/API Logic) ---

class DailyAPI {
  constructor() {
    this.baseGhibli = "https://ghibli.dailymorningupdate.com";
    this.baseFace = "https://faceswap.dailymorningupdate.com";
  }

  log(msg, data = "") {
    // console.log(`[LOG]: ${msg}`, data || ""); // Logging disabled for bot context
  }

  async buf(media) {
    try {
      if (!media) return null;
      if (Buffer.isBuffer(media)) return media;

      if (typeof media === "string" && media.startsWith("http")) {
        this.log("Downloading media...");
        const res = await axios.get(media, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
      }

      if (typeof media === "string" && (media.includes("base64,") || media.length > 200)) {
        return Buffer.from(media.split(",").pop(), "base64");
      }

      return Buffer.from(media);
    } catch (e) {
      this.log("Failed to convert buffer", e.message);
      return null;
    }
  }

  async generate({ mode, prompt, image, source, target, ...rest }) {
    const form = new FormData();
    const queue = [];
    let url = "";

    this.log(`Init mode: ${mode}`);

    try {
      if (!mode) {
        return { error: true, msg: "Mode is required (ghibli/upscale/swap)" };
      }

      switch (mode) {
        case "ghibli":
          if (!prompt) {
            return { error: true, msg: "Field 'prompt' is required for ghibli mode" };
          }
          url = `${this.baseGhibli}/texttoghibli`;
          queue.push({ k: "prompt", v: prompt });
          queue.push({ k: "height", v: rest?.height || 512 });
          queue.push({ k: "width", v: rest?.width || 512 });
          break;

        case "upscale":
          if (!image) {
            return { error: true, msg: "Field 'image' is required for upscale mode" };
          }
          url = `${this.baseFace}/upscale`;
          queue.push({ k: "image", v: image, file: true });
          break;

        case "swap":
          if (!source) {
            return { error: true, msg: "Field 'source' is required for swap mode" };
          }
          if (!target) {
            return { error: true, msg: "Field 'target' is required for swap mode" };
          }
          url = `${this.baseFace}/swap_faces`;
          queue.push({ k: "source", v: source, file: true });
          queue.push({ k: "target", v: target, file: true });
          break;

        default:
          return { error: true, msg: `Mode '${mode}' is not valid` };
      }

      for (const item of queue) {
        const val = item.v;
        if (item.file) {
          this.log(`Processing buffer: ${item.k}`);
          const b = await this.buf(val);
          if (!b) {
            return { error: true, msg: `Failed to process media for ${item.k}` };
          }
          form.append(item.k, b, "req.jpg");
        } else {
          form.append(item.k, val);
        }
      }

      this.log(`POST to ${url}`);

      const res = await axios.post(url, form, {
        headers: { ...form.getHeaders() }
      });

      return this.processResponse(res.data, mode);

    } catch (e) {
      const errData = e?.response?.data || e?.message;
      this.log("Error Process:", errData);
      return { error: true, msg: JSON.stringify(errData) };
    }
  }

  processResponse(data, mode) {
    try {
      if (data.error) {
        return { error: true, msg: data.msg || data.message };
      }

      let imageBuffer = null;
      let info = {};

      switch (mode) {
        case "ghibli":
        case "upscale":
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            imageBuffer = this.base64ToBuffer(data.images[0]);
            info = {
              imageCount: data.images.length,
              mode: mode,
              ...Object.fromEntries(Object.entries(data).filter(([key]) => key !== "images"))
            };
          }
          break;

        case "swap":
          if (data.swapped_image) {
            imageBuffer = this.base64ToBuffer(data.swapped_image);
            info = {
              message: data.message,
              mode: "swap",
              ...Object.fromEntries(Object.entries(data).filter(([key]) => key !== "swapped_image"))
            };
          }
          break;
      }

      if (!imageBuffer) {
        return { error: true, msg: "No image generated", rawData: data };
      }

      return { buffer: imageBuffer, success: true, ...info };

    } catch (e) {
      this.log("Error processing response:", e.message);
      return { error: true, msg: "Failed to process API response", rawData: data };
    }
  }

  base64ToBuffer(base64String) {
    try {
      const base64Data = base64String.includes("base64,")
        ? base64String.split(",")[1]
        : base64String;

      return Buffer.from(base64Data, "base64");

    } catch (e) {
      this.log("Error converting base64 to buffer:", e.message);
      return null;
    }
  }
}
// --- End of DailyAPI Class ---

/**
 * Handler for the Ghibli Image Generation command.
 * The command is set to 'ghibli-art-generate' and takes a text prompt.
 */
let handler = async (m, { conn, text, command }) => {
    if (!text) {
        return m.reply(
            `*⚠️ Usage:*\n\nExample: *${command}* A girl standing on a hill watching the sunset.`
        );
    }

    const api = new DailyAPI();

    const params = {
        mode: 'ghibli',
        prompt: text,
    };

    m.reply("⏳ Generating Ghibli-style image...");

    const result = await api.generate(params);

    if (result.error) {
        console.error("Ghibli API Error:", result.msg);
        return m.reply(`❌ *Generation Failed*\nReason: ${result.msg}`);
    }

    if (result.success && result.buffer) {
        await conn.sendFile(
            m.chat,
            result.buffer,
            'ghibli.png',
            `✨ *Ghibli Art Generated!*\n\n*Prompt:* ${text}`,
            m
        );
    } else {
        return m.reply("❌ *Generation Failed*\nReason: No image buffer received.");
    }
};

// Command metadata
handler.help = handler.command = ['ghibli-art-generate'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
