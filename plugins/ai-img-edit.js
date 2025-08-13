/**
 * AI Image Modifier (img2img)
 * @package axios
 * Author: Noureddine
 */

import axios from "axios";

const handler = async (m, { conn, text, args }) => {
  try {
    // Extract URL and prompt from args or text
    let [url, prompt] = args.length >= 2
      ? [args[0], args.slice(1).join(" ")]
      : text.split("|").map(str => str.trim());

    if (!url || !prompt) {
      return m.reply(
        "Please provide both an image URL and a prompt.\nFormat: *ai-img-edit <url> | <prompt>* or *ai-img-edit <url> <prompt>*"
      );
    }

    // Validate URL
    if (!url.match(/^https?:\/\/.*\.(?:png|jpg|jpeg|gif)$/i)) {
      return m.reply("Please provide a valid image URL (png, jpg, jpeg, or gif).");
    }

    m.reply("Processing your image... Please wait.");

    const result = await img2img(url, prompt);

    // Send the resulting image
    await conn.sendFile(m.chat, result, "result.png", `Image modified with prompt: "${prompt}"`, m);

  } catch (error) {
    console.error(error);
    m.reply("An error occurred while processing the image. Please try again later.");
  }
};

async function img2img(url, prompt) {
  const { data } = await axios.post("https://vondyapi-proxy.com/images/", {
    model: "text-davinci-003",
    maxTokens: 3000,
    input: 'n0HQvTEEkUWWQVFhiW71y2ivBdv6SGth+IiWL0y0lDMUUWsJVWlbbr4h+Ik23FMFoFK0CZ67b3bPsmmxYDxK3o9X9mEZINpEgNE8lK2Fky7E/K/n1AHMUx4SWjr3ZgisE6tIGrvYW4yPrMp8xdeGDhgxdzxWkBAVoqCsInbMQJslEBtw+5kQCVdCxPRJVFDTSt+9tKnGF4yYutUNh+5hwjeBQyB8O4Fs3jpJqRloHq1Ki11cyAc0H6RNtrH/kI6Z2wksQNxKA829nuYgh5cW4xgtbgFFHunJuRsRSIinSZ8=',
    temperature: 0.5,
    e: true,
    summarizeInput: false,
    inHTML: false,
    size: "1024x1024",
    numImages: 1,
    useCredits: false,
    titan: false,
    quality: "standard",
    embedToken: null,
    edit: prompt,
    inputImageUrl: url,
    seed: 0,
    similarityStrength: 0.9045893528738,
    flux: true,
    pro: false,
    face: false,
    useGPT: false,
  });
  return data.data[0];
}

handler.help = ["ai-img-edit"];
handler.command = ["ai-img-edit"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
