import axios from "axios";
import FormData from "form-data";

class BackgroundRemover {
  constructor() {
    this.baseUrl = "https://srvrembg.pi7.org";
    this.apiUrl = `${this.baseUrl}/remove_bg_u2net`;
  }

  async generate(imageBuffer) {
    console.log("Starting background removal...");

    if (!imageBuffer?.length) throw new Error("Invalid image buffer");

    const formData = new FormData();
    const pid = `id_${Date.now()}${Math.random().toString(36).substring(2, 12)}`;

    formData.append("pid", pid);
    formData.append("myFile[]", imageBuffer, {
      filename: `image_${Date.now()}.jpg`,
      contentType: "image/jpeg",
    });

    const response = await axios.post(this.apiUrl, formData, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US",
        Connection: "keep-alive",
        Origin: "https://image.pi7.org",
        Referer: "https://image.pi7.org/",
        "User-Agent": "Mozilla/5.0",
        ...formData.getHeaders(),
      },
      timeout: 60000,
    });

    const resultUrl = `${this.baseUrl}/${response?.data?.images?.[0]?.filename}`;
    if (!resultUrl) throw new Error("No result image returned");

    return { result: resultUrl, pid };
  }
}

let handler = async (m, { conn, usedPrefix, command }) => {
  // Ensure user replies to an image
  let q = m.quoted;
  if (!q || !q.mimetype || !/image/.test(q.mimetype)) {
    return m.reply(
      `❌ Please *reply to an image* with:\n\n${usedPrefix + command}`
    );
  }

  let imageBuffer = await q.download();
  if (!imageBuffer) return m.reply("❌ Failed to download the image.");

  await m.reply("⏳ Removing background, please wait...");

  try {
    const api = new BackgroundRemover();
    const data = await api.generate(imageBuffer);

    await conn.sendFile(
      m.chat,
      data.result,
      "no-bg.png",
      "✅ Background removed successfully!",
      m
    );
  } catch (err) {
    console.error(err);
    await m.reply("❌ Error processing the image.");
  }
};

handler.help = ["srvrembg"];
handler.tags = ["editor"];
handler.command = ["srvrembg"];
handler.limit = true;

export default handler;
