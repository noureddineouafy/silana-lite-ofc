import axios from "axios";
import FormData from "form-data";
import baileys from "@adiwajshing/baileys";

const ttSearch = async (query, count = 3) => {
    try {
        let d = new FormData();
        d.append("keywords", query);
        d.append("count", count);
        d.append("cursor", 0);
        d.append("web", 1);
        d.append("hd", 1);

        let h = { headers: { ...d.getHeaders() } };
        let { data } = await axios.post("https://tikwm.com/api/feed/search", d, h);

        if (!data.data || !data.data.videos) return [];
        
        const baseURL = "https://tikwm.com";
        return data.data.videos.map(video => ({
            play: baseURL + video.play
        }));
    } catch (e) {
        console.log(e);
        return [];
    }
}

async function sendVideoAlbum(conn, m, videos, caption) {
    const album = baileys.generateWAMessageFromContent(m.chat, {
        albumMessage: {
            expectedVideoCount: videos.length, // Only supports videos
            contextInfo: m.quoted ? {
                remoteJid: m.quoted.key.remoteJid,
                fromMe: m.quoted.key.fromMe,
                stanzaId: m.quoted.key.id,
                participant: m.quoted.key.participant || m.quoted.key.remoteJid,
                quotedMessage: m.quoted.message
            } : {}
        }
    }, { quoted: m });

    await conn.relayMessage(album.key.remoteJid, album.message, {
        messageId: album.key.id
    });

    for (const [index, video] of videos.entries()) {
        const msg = await baileys.generateWAMessage(album.key.remoteJid, {
            video: { url: video.play },
            ...(index === 0 ? { caption } : {}) // Caption only on the first video
        }, {
            upload: conn.waUploadToServer
        });

        msg.message.messageContextInfo = {
            messageAssociation: {
                associationType: 1,
                parentMessageKey: album.key
            }
        };
        await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        });
    }
}

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply("Please enter the title you want to search for. *Example:* .tiktoksearch <Title> | <Count>");

    let [query, count] = text.split("|").map(v => v.trim());
    count = parseInt(count) || 3;

    let videos = await ttSearch(query, count);
    if (!videos.length) return m.reply("No videos found, try another keyword.");

    await sendVideoAlbum(conn, m, videos, "TikTok Search Results 🎵");
}

handler.help = ['tiktoksearch'];
handler.tags = ['search'];
handler.command = ['tiktoksearch'];
handler.limit = true 
export default handler;
