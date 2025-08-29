import axios from 'axios';
// plugin by noureddine Ouafy 
// scrape by Daffa channel 
async function generatePollinations(prompt, model = "flux", opts = {}) {
  const {
    width = 960,
    height = 1280,
    seed = Math.floor(Math.random() * 999999),
    nologo = true,
    enhance = true,
    hidewatermark = true,
  } = opts;

  try {
    const query = new URLSearchParams({
      model,
      width,
      height,
      seed,
    });

    if (nologo) query.set("nologo", "true");
    if (enhance) query.set("enhance", "true");
    if (hidewatermark) query.set("hidewatermark", "true");

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?${query.toString()}`;

    const res = await axios.get(url, {
      responseType: "arraybuffer",
    });

    return Buffer.from(res.data, "binary");
  } catch (err) {
    console.error("❌ Failed to generate image:", err.message);
    throw new Error("Failed to generate image from Pollinations AI.");
  }
}

// --- Handler Code ---

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `Please provide a prompt to generate an image.\n\n*Example Usage:*\n${usedPrefix + command} a cat wearing sunglasses\n\n*To use a specific model:*\n${usedPrefix + command} realistic | a photorealistic lion`;
  }

  try {
    await m.reply('🎨 Generating your image, please wait a moment...');

    const availableModels = ['flux', 'sdxl', 'midjourney', 'anime', 'realistic', 'turbo'];
    let model = 'flux'; // Default model
    let prompt = text.trim();

    // Check if the user specified a model using the '|' separator
    if (text.includes('|')) {
      const parts = text.split('|');
      const potentialModel = parts[0].trim().toLowerCase();
      if (availableModels.includes(potentialModel)) {
        model = potentialModel;
        prompt = parts.slice(1).join('|').trim(); // Re-join the rest in case the prompt also had '|'
      }
    }
    
    // Ensure there's a prompt after potentially stripping the model
    if (!prompt) {
        throw `You must provide a prompt after specifying the model.\n\n*Example:*\n${usedPrefix + command} realistic | a photorealistic lion`;
    }

    const imageBuffer = await generatePollinations(prompt, model);

    // Send the generated image back to the user
    conn.sendFile(m.chat, imageBuffer, 'generated_image.jpg', `*Model:* ${model}\n*Prompt:* ${prompt}`, m);

  } catch (e) {
    console.error(e);
    m.reply('Sorry, an error occurred while creating the image. Please try again later.');
  }
};

// --- Handler Metadata ---

handler.help = ['gen-ai'];
handler.command = ['gen-ai'];
handler.tags = ['ai'];
handler.limit = true; // Set to true to apply usage limits

export default handler;
