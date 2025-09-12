// Instagram: noureddine_ouafy
// scrape by malik

import axios from "axios";

class StableHorde {
  constructor({ apiKey = "" }) {
    this.api_key = apiKey || "0000000000";
    this.api = axios.create({
      baseURL: "https://stablehorde.net/api/v2",
      headers: {
        apikey: this.api_key,
        "Content-Type": "application/json"
      },
      timeout: 125e3
    });
  }

  async image(data_input) {
    try {
      const body = {
        prompt: data_input.prompt,
        params: { ...data_input, n: 1 },
        models: [data_input.model],
        nsfw: false,
        censor_nsfw: true
      };
      const response = await this.api.post("/generate/async", body);
      const { id } = response.data;
      if (!id) return { error: "Failed to get generation ID." };

      // Wait until generation is done
      while (true) {
        const status = await this.api.get(`/generate/status/${id}`);
        if (status.data.done) return status.data;
        await new Promise(res => setTimeout(res, 5000));
      }
    } catch (e) {
      return { error: e.message };
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Please provide a prompt.\nExample: *.horde a cat playing guitar*");

  m.reply("⏳ Please wait, generating image...");

  const api = new StableHorde({
    apiKey: process.env.STABLE_HORDE_API_KEY || "0000000000"
  });

  try {
    const result = await api.image({ prompt: text, model: "stable_diffusion" });

    if (result?.generations?.[0]?.img) {
      let imageUrl = result.generations[0].img;

      // Send image instead of sticker
      await conn.sendMessage(
        m.chat,
        { image: { url: imageUrl }, caption: `✅ Prompt: ${text}` },
        { quoted: m }
      );
    } else {
      m.reply("❌ Failed to generate image.");
    }
  } catch (err) {
    m.reply("❌ Error: " + err.message);
  }
};

handler.help = handler.command = ["horde"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
