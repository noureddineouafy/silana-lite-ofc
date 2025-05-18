import axios from "axios";

class YenusAI {
  constructor() {
    this.baseHeaders = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9",
      "content-type": "application/json",
      origin: "https://yenus.created.app",
      priority: "u=1, i",
      referer: "https://yenus.created.app/",
      "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "x-createxyz-project-id": "31b1368e-b142-4030-bef4-1a10d86e4873"
    };
  }

  async chat({ prompt, messages = [], stream = false }) {
    try {
      const res = await axios.post(
        "https://yenus.created.app/integrations/google-gemini-1-5-flash",
        {
          messages: messages.length ? messages : [{ role: "user", content: prompt }],
          stream: stream,
        },
        {
          headers: this.baseHeaders,
        }
      );
      return res.data;
    } catch (err) {
      return { error: err.message };
    }
  }

  async image({ prompt }) {
    try {
      const res = await axios.get(
        `https://yenus.created.app/integrations/dall-e-3?prompt=${encodeURIComponent(prompt)}`,
        {
          headers: this.baseHeaders,
        }
      );
      return res.data;
    } catch (err) {
      return { error: err.message };
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Please provide a prompt, e.g. `.test hello`");

  const yenus = new YenusAI();

  // You can add a keyword to switch between chat or image mode, e.g. starting prompt with "image:"
  let isImage = false;
  let prompt = text;
  if (text.toLowerCase().startsWith("image:")) {
    isImage = true;
    prompt = text.slice(6).trim();
    if (!prompt) return m.reply("Please provide an image prompt after 'image:'");
  }

  let response;
  if (isImage) {
    response = await yenus.image({ prompt });
    if (response.error) return m.reply("Error: " + response.error);

    // Send image URL or send the image directly if your bot supports it
    if (response.url) {
      await conn.sendFile(m.chat, response.url, "image.jpg", `Image result for: ${prompt}`, m);
    } else {
      m.reply("No image found for that prompt.");
    }
  } else {
    response = await yenus.chat({ prompt });
    if (response.error) return m.reply("Error: " + response.error);

    // The response structure might vary; adjust according to API
    let textResponse = response.result || response.answer || JSON.stringify(response);
    m.reply(textResponse);
  }
};

handler.help = ["yenus-gemini"];
handler.tags = ["ai"];
handler.command = ["yenus-gemini"];
handler.limit = true;
export default handler;
