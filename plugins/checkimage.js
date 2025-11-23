// plugin by noureddine ouafy
// scrape by malik 

import axios from "axios";
import FormData from "form-data";

// 1. Define the Client Class
class SightEngineClient {
    constructor() {
        try {
            console.log("Inisialisasi client...");
            // Note: In a production app, keep these keys in a .env file
            this.apiUser = "505217032";
            this.apiSecret = "YPKBoEVgfG4ueygPnXCneBX55uygVEy7";
            this.baseURL = "https://api.sightengine.com/1.0/check.json";
            this.models = ["nudity-2.1", "weapon", "alcohol", "recreational_drug", "medical", "properties", "type", "quality", "offensive-2.0", "faces", "text-content", "face-age", "gore-2.0", "text", "qr-content", "tobacco", "genai", "violence", "self-harm", "money", "gambling"];
            console.log("Client siap");
        } catch (error) {
            console.error("Error inisialisasi:", error.message);
            throw error;
        }
    }

    async generate({
        image,
        model,
        ...rest
    }) {
        try {
            console.log("Mulai analisis gambar...");
            const models = this.validateModel(model);
            console.log(`Model: ${models}`);
            const formData = new FormData();
            formData.append("models", models);
            formData.append("api_user", this.apiUser);
            formData.append("api_secret", this.apiSecret);

            await this.processImage(formData, image);

            Object.keys(rest || {}).forEach(key => {
                try {
                    formData.append(key, rest[key]);
                } catch (error) {
                    console.warn(`Gagal tambah parameter ${key}:`, error.message);
                }
            });

            console.log("Kirim request...");
            const response = await axios.post(this.baseURL, formData, {
                headers: formData.getHeaders(),
                timeout: 3e4
            });

            console.log("Request berhasil", response.data);
            return response.data;
        } catch (error) {
            console.error("Error generate:", error.message);
            throw new Error(`Gagal analisis: ${error.response?.data?.message || error.message}`);
        }
    }

    validateModel(model) {
        try {
            console.log("Validasi model...");
            // Defaulting to a robust set if none provided, or use the specific one requested
            const defaultModels = "nudity-2.1,weapon,gore-2.0,type,properties"; 
            const input = (model || defaultModels).split(",").map(m => m.trim()).filter(m => m);
            
            const valid = input.filter(m => this.models.includes(m));
            if (valid.length === 0) {
                console.warn("Model tidak valid, gunakan default");
                return "nudity-2.1";
            }
            return valid.join(",");
        } catch (error) {
            console.error("Error validasi model:", error.message);
            return "nudity-2.1";
        }
    }

    async processImage(formData, image) {
        try {
            console.log("Proses gambar...");
            if (!image) {
                throw new Error("Image diperlukan");
            }
            if (typeof image === "string" && image.startsWith("http")) {
                console.log("Download dari URL...");
                const response = await axios.get(image, {
                    responseType: "arraybuffer",
                    timeout: 15e3
                });
                formData.append("media", Buffer.from(response.data), "image.jpg");
            } else if (typeof image === "string" && image.startsWith("data:")) {
                console.log("Proses base64...");
                const base64Data = image.split(",")[1] || image;
                const buffer = Buffer.from(base64Data, "base64");
                formData.append("media", buffer, "image.jpg");
            } else if (Buffer.isBuffer(image)) {
                console.log("Gunakan buffer...");
                formData.append("media", image, "image.jpg");
            } else {
                throw new Error("Format tidak didukung");
            }
            console.log("Gambar siap");
        } catch (error) {
            console.error("Error proses gambar:", error.message);
            throw new Error(`Gagal proses gambar: ${error.message}`);
        }
    }
}

// 2. The Handler
let handler = async (m, { conn, usedPrefix, command, args }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    if (!mime.startsWith('image')) {
        throw `Reply to an image or send an image with the caption *${usedPrefix + command}*`;
    }

    m.reply('🔍 *Analyzing Image...* Please wait.');

    try {
        // Download the image into a buffer
        let media = await q.download();
        
        // Instantiate the client
        const api = new SightEngineClient();

        // Optional: User can specify models via arguments, e.g., .test weapon,gore
        // If no args, the class uses the default set defined in validateModel
        let userModels = args.join(',') || null; 

        // Call API
        const data = await api.generate({
            image: media,
            model: userModels
        });

        // Format results for WhatsApp
        let caption = `*🔍 SIGHTENGINE ANALYSIS*\n\n`;
        caption += `*Status:* ${data.status}\n`;
        
        // Add specific checks based on what returns (simplifying the JSON)
        if (data.nudity) caption += `*Nudity:* ${JSON.stringify(data.nudity, null, 2)}\n`;
        if (data.weapon) caption += `*Weapon:* ${data.weapon}\n`;
        if (data.gore) caption += `*Gore:* ${JSON.stringify(data.gore, null, 2)}\n`;
        if (data.type) caption += `*Type:* ${JSON.stringify(data.type, null, 2)}\n`;
        
        // Fallback to raw JSON if specific fields aren't neatly formatted
        if (!data.nudity && !data.weapon && !data.gore) {
             caption += `\n*Raw Data:*\n${JSON.stringify(data, null, 2)}`;
        }

        m.reply(caption);

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Error:* ${e.message}`);
    }
}

handler.help = ['checkimage']
handler.tags = ['tools']
handler.command = /^(checkimage)$/i
handler.limit = true;

export default handler
