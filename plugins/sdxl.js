import axios from 'axios';

/**
 * Sdxl Generate Image - Magic Eraser
 * Author  : gienetic
 * Base    : https://play.google.com/store/apps/details?id=com.duygiangdg.magiceraser
 * Plugin by : noureddine ouafy
 */

/**
 * Generates an image using the Magic Eraser API.
 * @param {string} promptText - The text prompt to generate the image from.
 * @returns {Promise<Buffer>} A buffer containing the generated image data.
 */
async function generateMagicEraser(promptText) {
  const baseUrl = 'https://apiimagen.magiceraser.fyi';
  const endpoint = '/imagen_v1';

  // Request parameters
  const params = {
    size: '1080x1920', // Default size
    negative_prompt: null,
    style: null,
    custom_style: null,
    prompt: promptText,
    version: 'sdxl'
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Dalvik/2.1.0', // Simulates a mobile device user-agent
    'Accept-Encoding': 'gzip'
  };

  try {
    const response = await axios({
      method: 'post',
      url: baseUrl + endpoint,
      params: params,
      headers: headers,
      responseType: 'arraybuffer' // Expecting image data back
    });

    // Convert the response data to a Buffer
    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Error in generateMagicEraser:', error.message);
    // Provide a more user-friendly error message
    throw new Error('Failed to contact the Magic Eraser API. It may be temporarily unavailable.');
  }
}

// --- Plugin Handler ---
const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `Please provide a prompt to create an image.\n\n*Example:* ${usedPrefix}${command} a majestic lion in a flower field`;
  }

  await m.reply("🎨 Generating your image with SDXL, please wait a moment...");

  try {
    // Generate the image from the user's prompt
    const imageBuffer = await generateMagicEraser(text);
    
    // Send the image back with a caption
    const caption = `*Prompt:* ${text}`;
    await conn.sendMessage(m.chat, { image: imageBuffer, caption: caption }, { quoted: m });

  } catch (error) {
    console.error(error);
    m.reply(`Sorry, an error occurred: ${error.message}`);
  }
};

handler.help = ['sdxl '];
handler.command = ['sdxl'];
handler.tags = ['ai'];
handler.limit = true; // Assumes a limiter/premium system is in place

export default handler;
