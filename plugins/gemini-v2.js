// instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios";

class GeminiAPI {
  constructor() {
    this.baseUrl = "https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1";
    this.headers = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    };
  }

  async getData(imageUrl) {
    try {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      return {
        inline_data: {
          mime_type: response.headers["content-type"],
          data: Buffer.from(response.data, "binary").toString("base64")
        }
      };
    } catch (error) {
      console.error(`Error fetching image from ${imageUrl}:`, error);
      throw new Error(`Failed to fetch image from ${imageUrl}`);
    }
  }

  async chat({ model = "gemini-2.0-flash-lite", prompt, imageUrl = null, ...rest }) {
    if (!prompt) throw new Error("Prompt is required");

    const url = this.baseUrl;
    const parts = [];

    if (imageUrl) {
      const urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
      for (const url of urls) {
        const imagePart = await this.getData(url);
        parts.push(imagePart);
      }
    }

    parts.push({ text: prompt });

    const body = {
      contents: [{ parts }],
      ...rest
    };

    try {
      const response = await axios.post(url, body, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error("Error fetching Gemini response:", error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

let handler = async (m, { conn, text, quoted }) => {
  if (!text) return m.reply("Please provide a prompt. \n .gemini-v2");

  await m.reply("المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  const gemini = new GeminiAPI();
  let imageUrl = null;

  if (quoted && /image/.test(quoted.mimetype)) {
    const media = await conn.downloadMediaMessage(quoted);
    imageUrl = `data:${quoted.mimetype};base64,${media.toString("base64")}`;
  }

  try {
    const result = await gemini.chat({ prompt: text, imageUrl });
    const output =
      result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini API.";
    await m.reply(output);
  } catch (err) {
    console.error(err);
    await m.reply("❌ Error: Failed to get response from Gemini API.");
  }
};

handler.help = handler.command = ["gemini-v2"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
