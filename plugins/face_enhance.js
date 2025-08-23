//plugin by noureddine ouafy 
// scrape by SaaOfc


import axios from "axios";
import { downloadContentFromMessage } from "@adiwajshing/baileys";

/**
 * Scrapes an AI image upscaling service.
 * @param {Buffer} buffer The image buffer to upscale.
 * @param {number} [scale=4] The upscale factor (from 2 to 10).
 * @param {boolean} [faceEnhance=false] Whether to apply face enhancement.
 * @returns {Promise<string>} The URL of the upscaled image.
 */
async function upscaleImage(buffer, scale = 4, faceEnhance = false) {
  try {
    if (scale < 2 || scale > 10) {
      throw new Error("Scale must be between 2 and 10.");
    }

    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    const start = await axios.post(
      "https://fooocus.one/api/predictions",
      {
        version: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input: {
          face_enhance: faceEnhance,
          image: base64Image,
          scale
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          Origin: "https://fooocus.one",
          Referer: "https://fooocus.one/id/apps/batch-upscale-image"
        }
      }
    );

    const predictionId = start.data.data.id;
    if (!predictionId) {
      throw new Error("Failed to get a prediction ID from the API.");
    }

    let resultUrl;
    while (true) {
      const res = await axios.get(
        `https://fooocus.one/api/predictions/${predictionId}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: "https://fooocus.one/id/apps/batch-upscale-image"
          }
        }
      );

      if (res.data.status === "succeeded") {
        resultUrl = res.data.output;
        break;
      } else if (res.data.status === "failed") {
        throw new Error("Upscaling process failed according to the API.");
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return resultUrl;
  } catch (err) {
    console.error("Error during image upscaling:", err.message);
    throw err;
  }
}

// --- BOT HANDLER ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!/image/g.test(mime)) {
      return m.reply(`Please reply to an image with the command.\n\n*Example:*\n${usedPrefix + command} 8 true`);
    }

    let [scaleStr, faceEnhanceStr] = text.split(" ");
    let scale = parseInt(scaleStr) || 4;
    let faceEnhance = faceEnhanceStr?.toLowerCase() === "true" || false;

    await m.reply(`Upscaling your image to ${scale}x... Please wait a moment. ⏳`);

    // ✅ FIX: تحميل الصورة بالطريقة الصحيحة
    const stream = await downloadContentFromMessage(q, "image");
    let imgBuffer = Buffer.from([]);
    for await (const chunk of stream) {
      imgBuffer = Buffer.concat([imgBuffer, chunk]);
    }

    const resultUrl = await upscaleImage(imgBuffer, scale, faceEnhance);

    await conn.sendFile(
      m.chat,
      resultUrl,
      "upscaled.jpg",
      `✅ Image successfully upscaled to ${scale}x.`,
      m
    );
  } catch (e) {
    console.error(e);
    m.reply(`An error occurred: ${e.message}`);
  }
};

handler.help = ["face_enhance"];
handler.command = ["face_enhance"];
handler.tags = ["tools"];
handler.limit = true;

export default handler;
