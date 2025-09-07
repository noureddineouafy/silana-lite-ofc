// instagram.com/noureddine_ouafy
import axios from "axios";

let handler = async (m, { conn, args }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";

    if (!mime) return m.reply("Reply or send an image with the caption *.img2prompt*");
    if (!/image\/(jpe?g|png)/.test(mime)) return m.reply("Only JPEG/PNG images are supported");

    let imgBuffer = await q.download();
    let base64Img = imgBuffer.toString("base64");
    let base64Url = `data:${mime};base64,${base64Img}`;

    let { data } = await axios.post(
      "https://imageprompt.org/api/ai/prompts/image",
      { base64Url },
      { headers: { accept: "/", "content-type": "application/json" } }
    );

    let prompt = data?.prompt || data;
    if (!prompt) return m.reply("No prompt generated");

    await m.reply(`${prompt}`);
  } catch (e) {
    m.reply(`Error: ${e.message}`);
  }
};

handler.help = ["img2prompt"];
handler.command = ["img2prompt"];
handler.tags = ["ai"];
handler.limit = true
export default handler;
