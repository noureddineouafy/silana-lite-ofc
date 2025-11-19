// instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios";
import * as cheerio from "cheerio";

// Simple internal Arabic → English translator using Google Translate endpoint
async function translateToEnglish(text) {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" +
      encodeURIComponent(text);

    const { data } = await axios.get(url);
    return data[0].map((t) => t[0]).join("");
  } catch {
    return text; // fallback: use original text
  }
}

const BASE_URL = "https://unrestrictedaiimagegenerator.com/";

class ImageGenClient {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "id-ID",
        Referer: BASE_URL,
        Origin: BASE_URL,
      },
    });
  }

  async fetchInitData() {
    try {
      const res = await this.client.get("/");
      const $ = cheerio.load(res.data);

      const nonce =
        $('#imageGeneratorForm input[name="_wpnonce"]')?.val() || null;

      const styles = [];
      $("#imageStyle option").each((i, el) => {
        const v = $(el).attr("value");
        if (v) styles.push(v);
      });

      return { nonce, styles };
    } catch (e) {
      return { nonce: null, styles: null, error: e.message };
    }
  }

  async generate({ prompt, style }) {
    const reqPrompt = prompt || "A robot coding in a jungle, digital art";

    const { nonce, styles, error } = await this.fetchInitData();
    if (error) return { success: false, message: error };

    if (!nonce) return { success: false, message: "Nonce missing." };

    const finalStyle =
      styles?.includes(style) ? style : "photorealistic";

    try {
      const formData = new URLSearchParams();
      formData.append("generate_image", "true");
      formData.append("image_description", reqPrompt);
      formData.append("image_style", finalStyle);
      formData.append("_wpnonce", nonce);

      const res = await this.client.post("/", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const $ = cheerio.load(res.data);

      const url = $("#resultImage")?.attr("src");
      const errorText = $("#error.active")?.text()?.trim();

      if (errorText) return { success: false, message: errorText };

      if (!url)
        return { success: false, message: "Image URL not found." };

      return {
        success: true,
        prompt: reqPrompt,
        style: finalStyle,
        image_url: url,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}

// ==============================
//         SILANA HANDLER
// ==============================

let handler = async (m, { conn, args }) => {
  if (!args[0])
    return m.reply(
      `Please provide a prompt.\nExample:\n.img أسد فوق جبل فالغروب`
    );

  await m.reply(
    `المرجو الانتظار قليلا لا تنسى ان تتابع\ninstagram.com/noureddine_ouafy`
  );

  const originalPrompt = args.join(" ");

  // Auto translate Arabic → English
  const translatedPrompt = await translateToEnglish(originalPrompt);

  const api = new ImageGenClient();
  const result = await api.generate({ prompt: translatedPrompt });

  if (!result.success)
    return conn.reply(m.chat, `❌ Error: ${result.message}`, m);

  await conn.sendMessage(
    m.chat,
    {
      image: { url: result.image_url },
      caption: `✨ *AI Image Generated*\n\n*Prompt (AR):* ${originalPrompt}\n*Prompt (EN):* ${translatedPrompt}\n*Style:* ${result.style}`,
    },
    { quoted: m }
  );
};

handler.help = handler.command = ["imagegen"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
