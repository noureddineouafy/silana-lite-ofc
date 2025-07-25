// plugin by noureddine ouafy
// scrape by rynn-stuff

import axios from 'axios';
import crypto from 'crypto';

/**
 * This handler generates a short video with sound based on a user's text prompt,
 * using the Luna AI video service endpoint.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Check if the user has provided a text prompt.
    if (!text) {
        throw `Please provide a text prompt to generate a video.\n\n*Example:*\n${usedPrefix + command} a futuristic city with flying cars`;
    }

    try {
        // Inform the user that the process has started.
        await m.reply('🎬 Starting Luna AI video generation... This may take a moment, please wait.');

        // --- Configuration for the video generation ---
        const model = 'veo-3-fast'; // Model used by this endpoint
        const auto_sound = true;    // Generate with sound by default
        const auto_speech = false;
        
        // --- Step 1: Obtain a verification token from the API's security endpoint. ---
        // This uses the new keys and URLs for the lunaai.video source.
        const { data: cf } = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
            params: {
                mode: 'turnstile-min',
                siteKey: '0x4AAAAAAAdJZmNxW54o-Gvd',
                url: 'https://lunaai.video/features/v3-fast',
                accessKey: '5238b8ad01dd627169d9ac2a6c843613d6225e6d77a6753c75dc5d3f23813653'
            }
        });
        
        // Validate the response from the security endpoint.
        if (!cf.result || !cf.result.token) {
            throw new Error('Failed to obtain the required verification token. The service might be down.');
        }
        const verifyToken = cf.result.token;
        
        // --- Step 2: Submit the video generation task. ---
        // Create a unique identifier for this specific request.
        const uid = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        
        // Send a POST request to create the video task. Note the 'source' is now 'lunaai.video'.
        const { data: task } = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
            prompt: text, // The user's prompt
            imgUrls: [],
            quality: '720p',
            duration: 8,
            autoSoundFlag: auto_sound,
            soundPrompt: '',
            autoSpeechFlag: auto_speech,
            speechPrompt: '',
            speakerId: 'Auto',
            aspectRatio: '16:9',
            secondaryPageId: 1811,
            channel: 'VEO3',
            source: 'lunaai.video', // The new source for this plugin
            type: 'features',
            watermarkFlag: true,
            privateFlag: true,
            isTemp: true,
            vipFlag: true,
            model: model
        }, {
            headers: {
                'uniqueid': uid,
                'verify': verifyToken
            }
        });
        
        // Validate the task creation response.
        if (!task.data || !task.data.recordId) {
            throw new Error('Failed to create the video generation task. Please check the API status.');
        }
        const recordId = task.data.recordId;
        
        // --- Step 3: Poll the API to check the status of the task. ---
        let resultData;
        while (true) {
            await new Promise(res => setTimeout(res, 3000));
            
            const { data: statusResponse } = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${recordId}`, {
                headers: {
                    'uniqueid': uid,
                    'verify': verifyToken
                }
            });
            
            const state = statusResponse.data?.state;
            
            if (state === 'success') {
                resultData = JSON.parse(statusResponse.data.completeData);
                break;
            } else if (state === 'fail') {
                throw new Error('Video generation failed. The prompt might be invalid or the service is busy.');
            }
        }
        
        // --- Step 4: Send the generated video to the user. ---
        const videoUrl = resultData?.data?.video_url;

        if (videoUrl) {
            await conn.sendFile(m.chat, videoUrl, 'generated_video.mp4', `*Generated with Luna AI for prompt:* "${text}"`, m);
        } else {
            await m.reply('Video was generated, but I could not find the video URL. Here is the raw data:');
            await m.reply(JSON.stringify(resultData, null, 2));
        }

    } catch (error) {
        console.error(error);
        await m.reply(`Sorry, something went wrong:\n${error.message}`);
    }
};

// --- Handler Configuration ---
handler.help = ['aivideo'];
handler.command = /^(aivideo)$/i;
handler.tags = ['ai'];
handler.limit = true;
handler.premium = false;
export default handler;
