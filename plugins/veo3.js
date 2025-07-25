// plugin ofc by noureddine ouafy 
// scrape by rynn-stuff


import axios from 'axios';
import crypto from 'crypto';

/**
 * This handler generates a short video with sound based on a user's text prompt using an external AI video generation service.
 * It communicates with the user, handles the API requests, polls for the result, and sends the final video.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Check if the user has provided a text prompt.
    if (!text) {
        // If no prompt is given, inform the user about the correct usage.
        throw `Please provide a text prompt to generate a video.\n\n*Example:*\n${usedPrefix + command} a majestic lion walking in the savanna`;
    }

    try {
        // Inform the user that the process has started and may take some time.
        await m.reply('🎬 Starting video generation with sound... This might take a moment, please wait.');

        // --- Configuration for the video generation ---
        const model = 'veo-3-fast'; // Available models: 'veo-3-fast', 'veo-3'
        const auto_sound = true; // **FIX:** Enabled automatic sound generation.
        const auto_speech = false; // Keep speech off unless specifically needed.
        
        // --- Step 1: Obtain a verification token from the API's security endpoint. ---
        // This is likely a measure to prevent automated abuse.
        const { data: cf } = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
            params: {
                mode: 'turnstile-min',
                siteKey: '0x4AAAAAAANuFg_hYO9YJZqo',
                url: 'https://aivideogenerator.me/features/g-ai-video-generator',
                accessKey: 'e2ddc8d3ce8a8fceb9943e60e722018cb23523499b9ac14a8823242e689eefed'
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
        
        // Send a POST request to create the video task with all the specified parameters.
        const { data: task } = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
            prompt: text, // The user's prompt
            imgUrls: [],
            quality: '720p',
            duration: 8,
            autoSoundFlag: auto_sound, // Pass the updated sound flag here
            soundPrompt: '',
            autoSpeechFlag: auto_speech,
            speechPrompt: '',
            speakerId: 'Auto',
            aspectRatio: '16:9',
            secondaryPageId: 1811,
            channel: 'VEO3',
            source: 'aivideogenerator.me',
            type: 'features',
            watermarkFlag: true,
            privateFlag: true,
            isTemp: true,
            vipFlag: true,
            model: model
        }, {
            headers: {
                'uniqueid': uid, // The unique ID for this session
                'verify': verifyToken // The verification token from Step 1
            }
        });
        
        // Validate the task creation response.
        if (!task.data || !task.data.recordId) {
            throw new Error('Failed to create the video generation task. Please check the API status.');
        }
        const recordId = task.data.recordId;
        
        // --- Step 3: Poll the API to check the status of the task. ---
        // This loop will continue until the video is successfully generated or fails.
        let resultData;
        while (true) {
            // Wait for a few seconds before checking the status again to avoid spamming the API.
            await new Promise(res => setTimeout(res, 3000));
            
            const { data: statusResponse } = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${recordId}`, {
                headers: {
                    'uniqueid': uid,
                    'verify': verifyToken
                }
            });
            
            const state = statusResponse.data?.state;
            
            if (state === 'success') {
                // If successful, parse the completion data and exit the loop.
                resultData = JSON.parse(statusResponse.data.completeData);
                break;
            } else if (state === 'fail') {
                // If the task fails, throw an error.
                throw new Error('Video generation failed. The prompt might be invalid or the service is busy.');
            }
            // If the state is 'processing' or another value, the loop will continue.
        }
        
        // --- Step 4: Send the generated video to the user. ---
        const videoUrl = resultData?.data?.video_url;

        if (videoUrl) {
            await conn.sendFile(m.chat, videoUrl, 'generated_video.mp4', `*Here is your generated video for the prompt:* "${text}"`, m);
        } else {
            // Fallback message if the video URL is not found in the response.
            await m.reply('Video was generated, but I could not find the video URL. Here is the raw data:');
            await m.reply(JSON.stringify(resultData, null, 2));
        }

    } catch (error) {
        // Catch and log any errors that occur during the process.
        console.error(error);
        // Inform the user that an error has occurred.
        await m.reply(`Sorry, something went wrong:\n${error.message}`);
    }
};

// --- Handler Configuration ---
// Define how the command should be invoked and categorized.
handler.help = ['veo3'];
handler.command = /^(veo3)$/i; // Command can be 'veo3' or 'aivideo'
handler.tags = ['ai'];
handler.limit = true; // Assumes a system to limit usage.
handler.premium = false; // Set to true if it's a premium-only command.

export default handler;
