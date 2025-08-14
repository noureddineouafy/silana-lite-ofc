import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let handler = async (m, { conn }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!mime) {
        return m.reply(`Please send/reply to an image with the caption *${m.prefix + m.command}*`);
    }
    if (!/image\/(jpe?g|png)/.test(mime)) {
        return m.reply(`Format ${mime} is not supported! Only jpeg/jpg/png allowed`);
    }

    m.react('🖐'); // Hand emoji to indicate processing

    try {
        // Download image
        let imgData = await q.download();

        // Prepare FormData for API
        const form = new FormData();
        form.append('image', imgData, {
            filename: 'upload.jpg',
            contentType: mime
        });

        // Send to API
        const response = await axios.post('https://xyro.site/fun/putihkan', form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer'
        });

        // Save result temporarily
        const tempPath = path.join(__dirname, '../tmp', `result_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, response.data);

        // Send processed image
        await conn.sendMessage(m.chat, {
            image: fs.readFileSync(tempPath),
            caption: '✅ Processing complete'
        }, { quoted: m });

        // Clean up temporary file after 30 seconds
        setTimeout(() => {
            try {
                fs.unlinkSync(tempPath);
            } catch (e) {
                console.error('Failed to delete temporary file:', e);
            }
        }, 30000);

    } catch (error) {
        console.error('Error:', error);

        let errorMessage = 'Failed to process the image';
        if (error.response) {
            try {
                errorMessage = error.response.data?.message ||
                    error.response.statusText ||
                    'API error';
            } catch (e) {
                errorMessage = 'Invalid response format';
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        m.reply(`Error: ${errorMessage}`);
    }
};

handler.help = ['whiten'];
handler.tags = ['tools'];
handler.command = /^whiten$/i;
handler.limit = true;

export default handler;
