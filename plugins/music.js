//translate and modified by noureddine
//plugin by Izuku-mi

import axios from "axios"
import crypto from "crypto"
import yts from "yt-search"

const handler = async (m, { text, conn }) => {
    try {
        if (!text) return m.reply("⚠️ What music do you want to play?")

        const { all } = await yts(text)
        const metadata = all[0]
        if (!metadata) return m.reply("❌ Music not found")

        const url = metadata.url

        const client = axios.create({
            headers: {
                "content-type": "application/json",
                "origin": "https://yt.savetube.me",
                "user-agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36"
            }
        })

        // Extract video ID
        const idMatch = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)
        if (!idMatch) throw new Error("Invalid YouTube URL")

        const videoId = idMatch[1]

        // Get CDN
        const { data: cdnRes } = await client.get("https://media.savetube.vip/api/random-cdn")
        const cdn = cdnRes.cdn

        // Get encrypted info
        const { data: infoRes } = await client.post(`https://${cdn}/v2/info`, {
            url: `https://www.youtube.com/watch?v=${videoId}`
        })

        // Decrypt data
        const encrypted = Buffer.from(infoRes.data, "base64")
        const key = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")
        const iv = encrypted.subarray(0, 16)

        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
        const decrypted = Buffer.concat([
            decipher.update(encrypted.subarray(16)),
            decipher.final()
        ])

        const meta = JSON.parse(decrypted.toString())

        // Request download
        const { data: dlRes } = await client.post(`https://${cdn}/download`, {
            id: videoId,
            downloadType: "audio",
            quality: "128",
            key: meta.key
        })

        const download = dlRes?.data?.downloadUrl
        if (!download) throw new Error("Failed to get download link")

        const caption = `🎵 Play Music:
• Title: ${metadata.title || ""}
• Artist: ${metadata.author?.name || ""}
• URL: ${metadata.url || ""}
• Duration: ${metadata.timestamp || ""}

(+ ) Source: OmegaTech`

        await conn.sendMessage(
            m.chat,
            {
                image: { url: meta.thumbnail },
                caption
            },
            { quoted: m }
        )

        await conn.sendMessage(
            m.chat,
            {
                audio: { url: download },
                mimetype: "audio/mpeg"
            },
            { quoted: m }
        )

    } catch (e) {
        console.error(e)
        m.reply("❌ Error occurred. Maybe too many requests.")
    }
}

handler.command = ["music"]
handler.help = ["music"]
handler.tags = ["downloader"]
export default handler
