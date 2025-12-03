// plugin by noureddine ouafy
// scrape by https://share.petrolabs.me/tools/videoenhance

import fs from "node:fs/promises";
import { resolve } from "node:path";
import crypto from "node:crypto";
import axios from "axios"; // Used to download media from the message
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory to store temporary files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tempDir = join(__dirname, 'temp');

// Ensure the temp directory exists
try {
    await fs.mkdir(tempDir, { recursive: true });
} catch (e) {
    console.error("Failed to create temp directory:", e);
}


async function jsonFetch(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        return { __httpError: true, status: res.status, raw: text };
    }
    if (!res.ok) {
        return { __httpError: true, status: res.status, raw: json };
    }
    return json;
}

const baseApi = "https://api.unblurimage.ai";


/**
 * @param {import('@adiwajshing/baileys').WAMessage} m 
 * @param {object} param1 
 * @param {import('@adiwajshing/baileys').WASocket} param1.conn
 */
let handler = async (m, { conn }) => {
    const productSerial = crypto.randomUUID().replace(/-/g, "");
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let videoPath = null;
    let tempFilePath = null;

    try {
        // --- 1. Get Video from Message ---
        
        // Check if the message contains a video or is a reply to a video
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!/video/.test(mime)) {
            return m.reply("Please send or reply to a video with this command.");
        }

        // Download the video and save it temporarily
        let media = await q.download?.();
        if (!media) {
            return m.reply("Failed to download video.");
        }

        // Determine the temporary path
        tempFilePath = join(tempDir, `input-video-${m.sender}-${Date.now()}.mp4`);
        await fs.writeFile(tempFilePath, media);
        videoPath = tempFilePath;
        
        const absPath = resolve(videoPath);
        
        await m.reply("✅ Video received. Starting the upscale process...");

        // --- 2. Video Upload (Step 1: Request Upload URL) ---

        const uploadForm = new FormData();
        uploadForm.set("video_file_name", `cli-${Date.now()}.mp4`);

        const uploadResp = await jsonFetch(
            `${baseApi}/api/upscaler/v1/ai-video-enhancer/upload-video`,
            { method: "POST", body: uploadForm }
        );

        if (uploadResp.__httpError || uploadResp.code !== 100000) {
            return m.reply(`❌ Failed to request upload URL. Code: ${uploadResp.code || uploadResp.status}`);
        }

        const { url: uploadUrl, object_name } = uploadResp.result || {};
        if (!uploadUrl || !object_name) {
            return m.reply("❌ Failed to get upload URL or object name.");
        }

        // --- 3. Video Upload (Step 2: PUT File to URL) ---
        
        const fileBuffer = await fs.readFile(absPath);

        const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "content-type": "video/mp4" },
            body: fileBuffer,
        });

        if (!putRes.ok) {
            return m.reply(`❌ Failed to upload file. Status: ${putRes.status}`);
        }
        
        await m.reply("⬆️ Video successfully uploaded. Starting conversion job...");

        // --- 4. Create Enhancer Job ---

        const cdnUrl = `https://cdn.unblurimage.ai/${object_name}`;

        const jobForm = new FormData();
        jobForm.set("original_video_file", cdnUrl);
        jobForm.set("resolution", "2k"); // Can be changed if needed
        jobForm.set("is_preview", "false");

        const createJobResp = await jsonFetch(
            `${baseApi}/api/upscaler/v2/ai-video-enhancer/create-job`,
            {
                method: "POST",
                body: jobForm,
                headers: {
                    "product-serial": productSerial,
                    authorization: "", // Fill in if authorization is required
                },
            }
        );

        if (createJobResp.__httpError || createJobResp.code !== 100000) {
            return m.reply(`❌ Failed to create job. Code: ${createJobResp.code || createJobResp.status}`);
        }

        const { job_id, long_video } = createJobResp.result || {};
        if (!job_id) {
            return m.reply("❌ Job ID not found.");
        }
        
        await m.reply(`⏳ Job ID: ${job_id} created. Waiting for results... (Max 5 minutes)`);

        // --- 5. Poll Job Status ---

        const maxTotalWaitMs = 5 * 60 * 1000;
        const startTime = Date.now();
        let attempt = 0;
        let result;

        while (true) {
            attempt++;

            const jobResp = await jsonFetch(
                `${baseApi}/api/upscaler/v2/ai-video-enhancer/get-job/${job_id}`,
                {
                    method: "GET",
                    headers: {
                        "product-serial": productSerial,
                        authorization: "", // Fill in if authorization is required
                    },
                }
            );

            if (jobResp.__httpError) {
                // Do not fail if HTTP status error, try again
                // return m.reply(`❌ Failed while polling job status. Status: ${jobResp.status}`);
            } else if (jobResp.code === 100000) {
                result = jobResp.result || {};
                if (result.output_url) break; // Job finished and result URL is available
            } else if (jobResp.code !== 300010) {
                // 300010 = Job is in progress
                return m.reply(`❌ Job failed or unknown status. Code: ${jobResp.code}`);
            }

            const elapsed = Date.now() - startTime;
            if (elapsed > maxTotalWaitMs) {
                return m.reply(`⏰ Timeout reached after ${Math.round(elapsed / 1000)} seconds. The job might still be processing on the server.`);
            }

            // Waiting rule: 30 seconds for the first attempt, then 10 seconds
            await sleep(attempt === 1 ? 30 * 1000 : 10 * 1000);
        }

        // --- 6. Send Result ---

        const { output_url } = result;

        if (output_url) {
            await m.reply("✅ Job finished. Sending the upscaled video...");
            
            // Download the resulting video and send it
            const { data } = await axios.get(output_url, { responseType: 'arraybuffer' });
            
            await conn.sendMessage(m.chat, {
                video: Buffer.from(data),
                caption: `🌟 **Video Upscale Successful!**\n\nResolution: 2K\nURL: ${output_url}`,
                fileName: `upscaled-${job_id}.mp4`
            }, { quoted: m });
            
        } else {
            m.reply("❌ Job finished, but the output URL was not found.");
        }

    } catch (err) {
        console.error("Error running hdvideo handler:", err);
        m.reply(`❌ A runtime error occurred: ${err.message}`);
    } finally {
        // --- 7. Cleanup ---
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
                console.log(`Temporary file deleted: ${tempFilePath}`);
            } catch (e) {
                console.error(`Failed to delete temporary file ${tempFilePath}:`, e);
            }
        }
    }
}

// --- Handler Configuration ---

handler.help = ['hdvideo'];
handler.command = ['hdvideo'];
handler.tags = ['tools'];
handler.limit = true; // Usage limit if your bot supports it

export default handler;
