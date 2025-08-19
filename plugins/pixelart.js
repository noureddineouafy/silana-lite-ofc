// plugin by noureddine ouafy
// scrape by NekoLabs


import axios from 'axios';
async function textToPixel(prompt, ratio = '1:1') {
    if (!prompt) throw new Error('A text prompt is required.');
    if (!['1:1', '3:2', '2:3'].includes(ratio)) throw new Error('Available ratios: 1:1, 3:2, 2:3');

    try {
        // Request to generate the image from text
        const { data: generateResponse } = await axios.post('https://pixelartgenerator.app/api/pixel/generate', {
            prompt: prompt,
            size: ratio,
            type: 'text'
        }, {
            headers: {
                'content-type': 'application/json',
                'referer': 'https://pixelartgenerator.app/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        const taskId = generateResponse.data.taskId;

        // Poll for the status of the generation task
        while (true) {
            const { data: statusResponse } = await axios.get(`https://pixelartgenerator.app/api/pixel/status?taskId=${taskId}`, {
                headers: {
                    'referer': 'https://pixelartgenerator.app/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });

            if (statusResponse.data.status === 'SUCCESS') {
                return statusResponse.data.images[0]; // Return the first image URL
            }
            // Wait for 1 second before checking the status again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Error in textToPixel:', error);
        throw new Error(error.message);
    }
}
async function imageToPixel(buffer, ratio = '1:1') {
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('An image buffer is required.');
    if (!['1:1', '3:2', '2:3'].includes(ratio)) throw new Error('Available ratios: 1:1, 3:2, 2:3');

    try {
        // Get a presigned URL for uploading the source image
        const { data: presignedUrlResponse } = await axios.post('https://pixelartgenerator.app/api/upload/presigned-url', {
            filename: `${Date.now()}_upload.jpg`,
            contentType: 'image/jpeg',
            type: 'pixel-art-source'
        }, {
            headers: {
                'content-type': 'application/json',
                'referer': 'https://pixelartgenerator.app/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        const { uploadUrl, key } = presignedUrlResponse.data;

        // Upload the image buffer to the presigned URL
        await axios.put(uploadUrl, buffer, {
            headers: {
                'content-type': 'image/jpeg',
                'content-length': buffer.length
            }
        });
        const { data: generateResponse } = await axios.post('https://pixelartgenerator.app/api/pixel/generate', {
            imageKey: key,
            prompt: '',
            size: ratio,
            type: 'image'
        }, {
            headers: {
                'content-type': 'application/json',
                'referer': 'https://pixelartgenerator.app/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        const taskId = generateResponse.data.taskId;

        // Poll for the status of the generation task
        while (true) {
            const { data: statusResponse } = await axios.get(`https://pixelartgenerator.app/api/pixel/status?taskId=${taskId}`, {
                 headers: {
                    'referer': 'https://pixelartgenerator.app/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });

            if (statusResponse.data.status === 'SUCCESS') {
                return statusResponse.data.images[0]; // Return the first image URL
            }
             // Wait for 1 second before checking the status again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Error in imageToPixel:', error);
        throw new Error(error.message);
    }
}


// Main handler for the command
const handler = async (m, { conn, text }) => {
    // Check if the message is a reply and contains an image
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    
    // Set a processing message
    await m.reply('Processing your request, please wait...');

    try {
        let imageUrl;
        if (/image/.test(mime)) {
            // If an image is quoted, download it and convert to pixel art
            const imgBuffer = await quoted.download();
            imageUrl = await imageToPixel(imgBuffer);
        } else if (text) {
            // If there's text, use it as a prompt for text-to-pixel
            imageUrl = await textToPixel(text);
        } else {
            // If no image or text is provided, show usage instructions
            m.reply('Please provide a text prompt or reply to an image to generate pixel art.');
            return;
        }

        // Send the generated pixel art image back to the user
        if (imageUrl) {
            await conn.sendFile(m.chat, imageUrl, 'pixel-art.png', `Here is your pixel art!`, m);
        } else {
            throw new Error('Failed to generate pixel art.');
        }

    } catch (error) {
        console.error(error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

// Command configuration
handler.help = ['pixelart'];
handler.command = ['pixelart'];
handler.tags = ['tools'];
handler.limit = true; 
export default handler;
