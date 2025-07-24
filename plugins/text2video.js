// plugin by Noureddine Ouafy 
// scrape by rynn-stuff

import axios from 'axios';
import crypto from 'crypto';

/**
 * Generates a video from a text prompt using an external API.
 * @param {string} prompt The text prompt for the video.
 * @param {string} [ratio='16:9'] The aspect ratio for the video. Supported values: '16:9', '9:16', '1:1', '4:3', '3:4'.
 * @returns {Promise<object>} A promise that resolves to an object containing the video data.
 * @throws {Error} Throws an error if the prompt is missing or if any API call fails.
 */
async function txt2vid(prompt, ratio = '16:9') {
    try {
        const supportedRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];
        
        if (!prompt) {
            throw new Error('A text prompt is required.');
        }
        if (!supportedRatios.includes(ratio)) {
            throw new Error(`Invalid ratio. Available ratios are: ${supportedRatios.join(', ')}`);
        }
        
        // Step 1: Get a verification token
        const { data: cf } = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
            params: {
                mode: 'turnstile-min',
                siteKey: '0x4AAAAAAATOXAtQtziH-Rwq',
                url: 'https://www.yeschat.ai/features/text-to-video-generator',
                accessKey: 'a40fc14224e8a999aaf0c26739b686abfa4f0b1934cda7fa3b34522b0ed5125d'
            }
        });

        if (!cf.result || !cf.result.token) {
            throw new Error('Failed to retrieve verification token.');
        }
        
        // Step 2: Create a unique ID and submit the video generation task
        const uid = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        const { data: task } = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
            prompt: prompt,
            imgUrls: [],
            quality: '540p',
            duration: 5,
            autoSoundFlag: false,
            soundPrompt: '',
            autoSpeechFlag: false,
            speechPrompt: '',
            speakerId: 'Auto',
            aspectRatio: ratio,
            secondaryPageId: 388,
            channel: 'PIXVERSE',
            source: 'yeschat.ai',
            type: 'features',
            watermarkFlag: false,
            privateFlag: false,
            isTemp: true,
            vipFlag: false
        }, {
            headers: {
                'uniqueid': uid,
                'verify': cf.result.token,
                'Content-Type': 'application/json'
            }
        });

        if (!task.data || !task.data.recordId) {
             throw new Error('Failed to create the video generation task.');
        }
        
        // Step 3: Poll for the result until the video is successfully generated
        while (true) {
            await new Promise(res => setTimeout(res, 3000)); // Wait for 3 seconds before checking status

            const { data: result } = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${task.data.recordId}`, {
                headers: {
                    'uniqueid': uid,
                    'verify': cf.result.token
                }
            });
            
            const record = result.data;
            if (record.state === 'success') {
                // The result is a JSON string in completeData, parse it to get the object
                return JSON.parse(record.completeData);
            }

            if (record.state === 'fail') {
                throw new Error(`Video generation failed. Reason: ${record.failReason || 'Unknown'}`);
            }
            // If the state is still 'pending' or another status, the loop will continue.
        }
    } catch (error) {
        // Consolidate error handling
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`An error occurred: ${errorMessage}`);
    }
}

// The main handler for the command
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Please provide a text prompt.\n\n*Example:*\n${usedPrefix + command} a majestic lion in the savanna | 16:9`);
    }

    try {
        // Let the user know the process has started
        await m.reply('⏳ Generating your video, please wait... This can take a minute.');

        // Parse the input text for prompt and ratio
        const parts = text.split('|').map(part => part.trim());
        const prompt = parts[0];
        const ratio = parts[1]; // Will be undefined if not provided, txt2vid will use default

        // Call the video generation function
        const response = await txt2vid(prompt, ratio);
        
        // --- FIXED ---
        // Based on the debug log, the correct path to the video URL is response.data.video_url
        const videoUrl = response?.data?.video_url;

        if (videoUrl) {
            // Send the generated video file to the user
            await conn.sendFile(m.chat, videoUrl, 'video.mp4', `*Prompt:* ${prompt}`, m);
        } else {
            // If the structure is unexpected, inform the user and log the response
            console.log('Unexpected API Response:', JSON.stringify(response, null, 2));
            m.reply('Could not find the video URL in the response. The API structure might have changed again. Please check the logs.');
        }

    } catch (e) {
        // Inform the user of any errors
        console.error(e);
        m.reply(`An error occurred while generating the video: ${e.message}`);
    }
};

// Handler configuration
handler.help = ['text2video'];
handler.tags = ['ai'];
handler.command = ['text2video'];
handler.limit = true; // Apply usage limits if your system has them

export default handler;
