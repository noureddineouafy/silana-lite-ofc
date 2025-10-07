// Instagram: noureddine_ouafy
// Description: Generate AI images using LailaAutobot API
// scrape by malik 
import axios from "axios";

class GenerateImage {
  async generateImage({ prompt, width = 1920, height = 1080 }) {
    const seed = Math.floor(Math.random() * 1e6);
    const imgUrl = `https://lailaautobot.one/api.php?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}`;

    try {
      const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch image:", error.message);
      throw new Error("Failed to generate image from external service.");
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text)
    return m.reply(`🖌️ Please provide a prompt to generate an image.\n\nExample:\n.aiimage beautiful Moroccan landscape at sunset`);

  await m.reply("🎨 Generating image, please wait...");

  try {
    const generator = new GenerateImage();
    const imageBuffer = await generator.generateImage({ prompt: text });

    await conn.sendMessage(
      m.chat,
      {
        image: imageBuffer,
        caption: `✅ Image generated successfully!\nPrompt: ${text}`,
      },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.help = handler.command = ["imagine"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
