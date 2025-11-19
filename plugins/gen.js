// plugin by noureddine ouafy 
// scrape by malik 
import axios from "axios"; // Assuming you have 'axios' installed: npm install axios

// Simple Google Translate API endpoint (no key needed)
async function translateToEnglish(text) {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" +
      encodeURIComponent(text);
      
    // Use axios to fetch the translation data
    const response = await axios.get(url);
    
    // The structure is an array of arrays; we extract and join the translated segments
    return response.data[0].map(t => t[0]).join("");
  } catch (error) {
    // Log the error but fall back gracefully
    console.error("Translation failed:", error.message);
    return text; // fallback: use original text
  }
}

// NOTE: Hardcoding the API key is generally a security risk. 
// Consider using environment variables in a real application.
const API_KEY = "E64FUZgN4AGZ8yZr";
const BASE_URL = "https://getimg-x4mrsuupda-uc.a.run.app";
const IMAGE_API_ENDPOINT = `${BASE_URL}/api-premium`;

let handler = async (m, { conn, args, usedPrefix, command }) => {
    
    // --- 1. Input Validation ---
    if (!args[0])
        return m.reply(`❗ Please write a prompt.\nExample:\n${usedPrefix + command} مدينة مستقبلية فالغروب`);

    let originalPrompt = args.join(" ");

    // --- 2. Initial Reply ---
    await m.reply(
      "⏳ المرجو الانتظار قليلاً، لا تنسى تتابع:\ninstagram.com/noureddine_ouafy"
    );

    try {
        // --- 3. Translation ---
        const prompt = await translateToEnglish(originalPrompt);

        // --- 4. API Request Setup ---
        const requestBody = new URLSearchParams({
            prompt: prompt,
            width: 512,
            height: 512,
            num_inference_steps: 20
        }).toString();
        
        const config = {
            method: "POST",
            url: IMAGE_API_ENDPOINT,
            headers: {
                // Use standard Content-Type for URL-encoded data
                "Content-Type": "application/x-www-form-urlencoded",
                // API-specific key header
                "Dzine-Media-API": API_KEY,
            },
            data: requestBody // axios uses 'data' for the request body
        };

        // --- 5. Make API Request ---
        const res = await axios(config);
        const data = res.data; // axios automatically parses JSON

        // --- 6. Result Validation ---
        if (res.status !== 200) {
            // Check for non-200 status codes
            throw new Error(`API Error: Status ${res.status}. Response: ${JSON.stringify(data)}`);
        }
        
        if (!data?.url) {
            // Check if the response body is missing the 'url' property
            return m.reply("❌ Failed to generate image. The API did not return an image URL.");
        }

        // --- 7. Send Image to Chat ---
        await conn.sendMessage(m.chat, {
            image: { url: data.url },
            caption: `✔ Image Generated Successfully!\nPrompt (AR): ${originalPrompt}\nPrompt (EN): ${prompt}`
        }, { quoted: m });

    } catch (e) {
        // --- 8. General Error Handling ---
        console.error("Image Generation Error:", e);
        // Reply with a user-friendly error message
        return m.reply(`❌ An error occurred during image generation: ${e.message}`);
    }
};

handler.help = handler.command = ['gen'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
