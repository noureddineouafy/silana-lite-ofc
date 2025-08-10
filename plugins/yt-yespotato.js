// plugin by noureddine ouafy 
import axios from 'axios'
import CryptoJS from 'crypto-js'

/**
 * Fetches video information from the API.
 * @param {string} url The YouTube URL.
 * @returns {Promise<object|string>} A promise that resolves to the video info object or an error string.
 */
async function info(url) {
    if (!url) return 'Where is the Youtube URL? '
    try {
        const SHARED_SECRET = "4W5crB-=A/klR]!";
        const ts = Date.now();
        // The origin value might need to be adjusted if the server environment changes.
        const origin = "http://192.168.251.190:3000";
        const payload = `${ts}|${origin}|${SHARED_SECRET}`;
        const signature = CryptoJS.SHA256(payload).toString();

        let { data } = await axios.post('https://yespotato.com/youtu999', {
            signature,
            ts,
            url
        }, {
            headers: {
                "Content-Type": "application/json",
                origin: "https://yespotato.com",
                referer: "https://yespotato.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            }
        })
        return data
    } catch (e) {
        console.error(e); // It's good practice to log the full error.
        return e.toString()
    }
}

/**
 * Downloads the video and audio, merges them, and returns the final download link.
 * @param {string} url The YouTube URL.
 * @param {string} quality The desired video quality (e.g., '480p').
 * @returns {Promise<object|string>} A promise that resolves to an object with the download link or an error string.
 */
async function download(url, quality = '480p') {
    if (!url) return 'Where is the URL?'
    try {
        // This part is duplicated from the info function. It could be refactored.
        const SHARED_SECRET = "4W5crB-=A/klR]!";
        const ts = Date.now();
        const origin = "http://192.168.251.190:3000";
        const payload = `${ts}|${origin}|${SHARED_SECRET}`;
        const signature = CryptoJS.SHA256(payload).toString();

        let { data } = await axios.post('https://yespotato.com/youtu999', {
            signature,
            ts,
            url
        }, {
            headers: {
                "Content-Type": "application/json",
                origin: "https://yespotato.com",
                referer: "https://yespotato.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            }
        })

        const index = data.urls.findIndex(item => item.qualityLabel === quality);
        const audio = data.urls.findIndex(item => item.mimeType.includes('audio/mp4'));
        if (index === -1) throw new Error(`Requested quality '${quality}' not found`);
        if (audio === -1) throw new Error('Audio stream not found');

        let videoInfo = data.urls[index]
        let audioInfo = data.urls[audio]

        // Step 1: Trigger the file download on the server
        let resp = await axios.post('https://yespotato.com/download-file', {
            contentLength: videoInfo.contentLength,
            file_type: 'video',
            has_audio: 'false',
            url: videoInfo.url,
            audioSize: audioInfo.contentLength,
            audioURL: audioInfo.url
        }, {
            headers: {
                "Content-Type": "application/json",
                origin: "https://yespotato.com",
                referer: "https://yespotato.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            }
        })

        // Step 2: Poll for download progress
        let progressData = await axios.get(`https://yespotato.com/progress/${resp.data.file_name}`)
        while (progressData.data.status !== 'done') {
            await new Promise(resolve => setTimeout(resolve, 2000))
            progressData = await axios.get(`https://yespotato.com/progress/${resp.data.file_name}`)
        }

        // Step 3: Trigger the encoding (merging) process
        let encode = await axios.post('https://yespotato.com/encode', {
            video_url: progressData.data.video_path,
            audio_url: progressData.data.audio_path
        }, {
            headers: {
                "Content-Type": "application/json",
                origin: "https://yespotato.com",
                referer: "https://yespotato.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            }
        })

        // Step 4: Poll for merging progress
        let mergeProgress = await axios.get(`https://yespotato.com/merge-progress/${encode.data.file_name}`)
        while (mergeProgress.data.status !== 'done') {
            await new Promise(resolve => setTimeout(resolve, 2000))
            mergeProgress = await axios.get(`https://yespotato.com/merge-progress/${encode.data.file_name}`)
        }

        // Step 5: Return the final link
        return {
            download: `https://yespotato.com${mergeProgress.data.outputLink}`
        }
    } catch (e) {
        console.error(e);
        return e.toString()
    }
}

/**
 * The main handler for the bot command.
 * @param {object} m The message object from the bot framework.
 * @param {object} params An object containing connection (`conn`) and text (`text`).
 */
let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('Please provide a YouTube URL')
    
    await m.reply('⏳ Fetching video info...')
    let videoInfo = await info(text)
    if (typeof videoInfo === 'string' || videoInfo instanceof Error) {
        return m.reply(`❌ Error fetching info: ${videoInfo}`)
    }

    // Filter out null/undefined qualities for a cleaner list
    const availableQualities = videoInfo.urls.map(u => u.qualityLabel).filter(Boolean).join(', ');
    const videoTitle = videoInfo.title || 'video'; // Use the title from the API if available

    await m.reply(`*Title:* ${videoTitle}\n\n*Available qualities:*\n${availableQualities}`)

    await m.reply('📥 Downloading and preparing your video, please wait...')
    
    // Default to 480p, but this could be made configurable based on user input.
    let downloadResult = await download(text, '480p') 
    if (typeof downloadResult === 'string' || downloadResult instanceof Error) {
        return m.reply(`❌ Error downloading video: ${downloadResult}`)
    }
    
    // --- MODIFIED PART ---
    // Send the video file directly instead of just sending the link.
    await conn.sendFile(m.chat, downloadResult.download, `${videoTitle}.mp4`, `✅ Here is your video!`, m)
}

handler.help = ['yt-yespotato']
handler.tags = ['downloader']
handler.command = ['yt-yespotato']
handler.limit = true // Assumes a rate-limiting system is in place
export default handler
