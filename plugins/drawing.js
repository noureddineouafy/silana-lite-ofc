// plugin by noureddine ouafy
// scrape by Author DAFFA

import axios from 'axios';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const imagen = {
    // 🎨 The list of styles is now at the top level, making it easy to access
    stylePrompts: {
      'No Style': '{prompt}',
      'Realistic': 'realistic photo {prompt}. highly detailed, high budget, highly details, epic, high quality',
      'Ghibli': 'style of studio ghibli, Hayao Miyazaki style',
      'GTA': 'GTA style {prompt}. Realistic gta art style, rockstar games artwork, vice city, photorealistic concept art, detailed face, realistic anatomy, epic, cinematic, high detail, highly detailed, 4k RAW',
      'Anime': 'anime style {prompt}. key visual, vibrant, studio anime, highly detailed',
      'Cinematic': 'cinematic still {prompt}. emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy',
      'Photographic': 'cinematic photo {prompt}. 35mm photograph, film, bokeh, professional, 4k, highly detailed',
      'Fantasy': 'ethereal fantasy concept art of {prompt}. magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy',
      'Cartoon': 'cartoon style {prompt}. cartoon, vibrant, high-energy, detailed',
      'Cyberpunk': 'cyberpunk style {prompt}. extremely detailed, photorealistic, 8k, realistic, neon ambiance, vibrant, high-energy, cyber, futuristic',
      'Manga': 'manga style {prompt}. vibrant, high-energy, detailed, iconic, Japanese comic style',
      'Digital Art': 'concept art {prompt}. digital artwork, illustrative, painterly, matte painting, highly detailed',
      'Colorful': 'colorful style {prompt}. color, vibrant, high-energy, detailed, cover art, dreamy',
      'Robot': 'robotic style {prompt}. robotic, vibrant, high-energy, detailed, cyber, futuristic',
      'Neonpunk': 'neonpunk style {prompt}. cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional',
      'Pixel Art': 'pixel-art style {prompt}. low-res, blocky, 8-bit graphics, 16-bit, pixel',
      'Disney': 'disney style {prompt}. disney cartoon, vibrant, high-energy, detailed, 3d, disney styles',
      '3D Model': 'professional 3d model {prompt}. octane render, highly detailed, volumetric, dramatic lighting',
    },
    api: {
      base: 'https://image.pollinations.ai',
      endpoints: {
        textToImage: (prompt, width, height, seed) =>
          `/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&safe=true&seed=${seed}`
      }
    },
    headers: {
      'user-agent': 'NB Android/1.0.0',
      'accept': 'image/jpeg',
      'Authorization': 'Bearer Vxbsp6f84MqPzLgK',
      'referer': 'https://image.pollinations.ai/'
    },
    request: (prompt, type, negative, size) => {
      // Now references the stylePrompts object from the parent scope
      const extraPrompt = (imagen.stylePrompts[type] || '{prompt}').replace('{prompt}', prompt);
      const fullNegative = `${negative}, ugly, glitch, bad eyes, low quality face, text, glitch, deformed, mutated, ugly, disfigured, nude, nudity, naked, sfw, nsfw, sex, erotic, pornography, hentai, explicit, fetish, bdsm, orgy, masturbate, masturbation, genital, vagina, penis, nipples, nipple, intercourse, ejaculation, orgasm, cunt, boobs, ****, tits, breast, ass, topless, fisting, censored`;

      let dimensions;
      switch (size) {
        case '3:4': dimensions = [864, 1152]; break;
        case '4:3': dimensions = [1152, 864]; break;
        case '16:9': dimensions = [1366, 768]; break;
        case '9:16': dimensions = [768, 1366]; break;
        default: dimensions = [1024, 1024];
      }
      return { extraPrompt, negative: fullNegative, dimensions };
    },
    generate: async (prompt = '', type = 'No Style', negative = '', size = '1:1') => {
      try {
        const { extraPrompt, dimensions } = imagen.request(prompt, type, negative, size);
        const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const url = `${imagen.api.base}${imagen.api.endpoints.textToImage(extraPrompt, dimensions[0], dimensions[1], seed)}`;

        const { data } = await axios.get(url, {
          headers: imagen.headers,
          timeout: 120000,
          responseType: 'arraybuffer'
        });

        if (!data || data.length === 0) {
          return { success: false, message: 'API returned an empty response.' };
        }
        
        return {
          success: true,
          buffer: Buffer.from(data),
          metadata: { prompt, type, dimensions, seed }
        };

      } catch (error) {
        console.error('Image Generation Error:', error);
        return { success: false, message: 'Failed to generate the image due to an error.' };
      }
    }
  };

  try {
    if (!text) {
      // ✅ **FIXED:** Correctly accesses the list of styles from `imagen.stylePrompts`
      const styles = Object.keys(imagen.stylePrompts).join(', ');
      throw `Please provide a prompt. \n\n*Example:* \n${usedPrefix + command} a cute cat | Realistic | 16:9\n\n*Available Styles:* \n${styles}`;
    }
    
    await m.reply('🎨 Generating your image, please wait...');

    const [prompt, style = 'Realistic', size = '1:1'] = text.split('|').map(s => s.trim());
    const result = await imagen.generate(prompt, style, '', size);
    
    if (result.success) {
      const caption = `
✨ *Image Generated!*

*Prompt:* ${result.metadata.prompt}
*Style:* ${result.metadata.type}
*Dimensions:* ${result.metadata.dimensions.join('x')}
      `.trim();
      await conn.sendFile(m.chat, result.buffer, 'image.jpg', caption, m);
    } else {
      await m.reply(`❌ Oops! Something went wrong. \n*Reason:* ${result.message}`);
    }

  } catch (e) {
    await m.reply(String(e));
  }
};

handler.help = ['drawing'];
handler.command = ['drawing'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
