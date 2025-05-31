import axios from 'axios';

const regex = /https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(\?[\w=&-]+)?|https:\/\/(?:www\.)?youtube\.com\/(?:shorts|watch)\/[a-zA-Z0-9_-]+(?:\?si=[a-zA-Z0-9_-]+)?/i;

const handler = async (m, { conn, args, command, usedPrefix }) => {
    try {
        if (!args[0]) {
            return m.reply(`Please enter a YouTube link!\n\nExample:\n${usedPrefix + command} https://youtu.be/Wky7Gz_5CZs`);
        }

        const isLink = args[0].match(regex);
        if (!isLink) {
            return m.reply("That's not a valid YouTube link!");
        }

        if (!conn.youtube) conn.youtube = {};
        if (typeof conn.youtube[m.sender] !== "undefined") {
            return m.reply("You are already downloading an audio!");
        }

        await m.reply("Please wait a moment...\ninstagram.com/noureddine_ouafy");
        conn.youtube[m.sender] = "loading";

        const response = await axios.get('https://api.vreden.my.id/api/ytmp3', {
            params: { url: args[0] },
        });

        const result = response.data;
        if (!result || result.status !== 200 || !result.result) {
            return m.reply("An error occurred while downloading the audio.");
        }

        const metadata = result.result.metadata;
        const download = result.result.download;

        if (!download || !download.url) {
            return m.reply("Audio is not available for download.");
        }

        const caption = `*YouTube Audio Downloader*

❏ Title: ${metadata.title}
❏ Duration: ${metadata.duration.timestamp}
❏ Author: ${metadata.author.name}
❏ Views: ${metadata.views.toLocaleString()} 
❏ Published: ${metadata.ago}`;

        // Send thumbnail and metadata
        await conn.sendMessage(m.chat, {
            image: { url: metadata.thumbnail },
            caption: caption
        }, { quoted: m });

        // Send audio file
        await conn.sendMessage(
            m.chat,
            { audio: { url: download.url }, mimetype: 'audio/mpeg', fileName: download.filename },
            { quoted: m }
        );

    } catch (error) {
        console.error(error);
        m.reply(`An error occurred while downloading the audio. Error: ${error.message}`);
    } finally {
        if (conn.youtube) {
            delete conn.youtube[m.sender];
        }
    }
};

handler.help = ['ytaudio2'];
handler.tags = ['downloader'];
handler.command = /^(ytaudio2)$/i;
handler.limit = true;
export default handler;
