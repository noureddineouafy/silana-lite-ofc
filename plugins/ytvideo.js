// plugin edit by instagram.com/noureddine_ouafy
// code origine by https://github.com/mruniquehacker/Knightbot-MD/blob/main/commands/video.js thanks brother
import axios from 'axios'
import yts from 'yt-search'

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*'
    }
}

async function tryRequest(getter, attempts = 3) {
    let lastError
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter()
        } catch (err) {
            lastError = err
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt))
            }
        }
    }
    throw lastError
}

// ===== DOWNLOAD SOURCES =====

async function getEliteProTechVideoByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
    if (res?.data?.success && res?.data?.downloadURL) {
        return {
            download: res.data.downloadURL,
            title: res.data.title
        }
    }
    throw new Error('EliteProTech failed')
}

async function getYupraVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
    if (res?.data?.success && res?.data?.data?.download_url) {
        return {
            download: res.data.data.download_url,
            title: res.data.data.title,
            thumbnail: res.data.data.thumbnail
        }
    }
    throw new Error('Yupra failed')
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
    if (res?.data?.result?.mp4) {
        return {
            download: res.data.result.mp4,
            title: res.data.result.title
        }
    }
    throw new Error('Okatsu failed')
}

// ===== MAIN HANDLER =====

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return conn.reply(m.chat, 
`🎬 *YouTube Video Downloader*

Usage:
${usedPrefix}ytvideo <YouTube link>
OR
${usedPrefix}ytvideo <video title>

Example:
${usedPrefix}ytvideo Alan Walker Faded
${usedPrefix}ytvideo https://youtu.be/dQw4w9WgXcQ`,
            m)
        }

        let videoUrl = ''
        let videoTitle = ''
        let videoThumbnail = ''

        if (text.startsWith('http://') || text.startsWith('https://')) {
            videoUrl = text
        } else {
            const { videos } = await yts(text)
            if (!videos || !videos.length) {
                return conn.reply(m.chat, '❌ No videos found.', m)
            }
            videoUrl = videos[0].url
            videoTitle = videos[0].title
            videoThumbnail = videos[0].thumbnail
        }

        await conn.reply(m.chat, '⏳ Downloading your video, please wait...', m)

        const apiMethods = [
            () => getEliteProTechVideoByUrl(videoUrl),
            () => getYupraVideoByUrl(videoUrl),
            () => getOkatsuVideoByUrl(videoUrl)
        ]

        let videoData
        for (let method of apiMethods) {
            try {
                videoData = await method()
                if (videoData?.download) break
            } catch { continue }
        }

        if (!videoData?.download) {
            throw new Error('All download sources failed.')
        }

        await conn.sendMessage(m.chat, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${(videoData.title || videoTitle || 'video').replace(/[^\w\s-]/g, '')}.mp4`,
            caption: `🎬 *${videoData.title || videoTitle || 'Video'}*\n\nDownloaded successfully!`
        }, { quoted: m })

    } catch (err) {
        console.error(err)
        conn.reply(m.chat, `❌ Error: ${err.message}`, m)
    }
}

handler.help = ['ytvideo']
handler.tags = ['downloader']
handler.command = ['ytvideo']
handler.limit = true

export default handler
