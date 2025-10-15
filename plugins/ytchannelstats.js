// plugin by: noureddine
// Instagram: @noureddine_ouafy
// Source: https://evano.com API
// scrape by : GilangSan
import axios from 'axios';

let handler = async (m, { conn, text }) => {
    if (!text) return conn.reply(m.chat, "Send me a YouTube channel URL. Example:\nhttps://youtube.com/@noureddineouafy2", m);

    try {
        // Fetch channel ID from URL
        let { data: channelid } = await axios.post(
            `https://api.evano.com/api/youtube/search`,
            { query: text, type: 'url' },
            {
                headers: {
                    "Content-Type": "application/json",
                    Origin: "https://evano.com",
                    Referer: "https://evano.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
                }
            }
        );

        if (!channelid.channelId) return conn.reply(m.chat, "Cannot find channel ID. Check the URL.", m);

        // Fetch analytics
        let { data } = await axios.get(
            `https://api.evano.com/api/youtube/channel/${channelid.channelId}/analytics`,
            {
                headers: {
                    Origin: "https://evano.com",
                    Referer: "https://evano.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
                }
            }
        );

        // Fallback for channel name
        const channelName = data.channel?.name || data.channel?.title || "Unknown Channel";

        // Check monetization
        const subs = parseInt(data.channel.subscriberCount || 0);
        const views = parseInt(data.channel.viewCount || 0);
        const watchHours = views * 0.1;
        const isMonetized = subs >= 1000 && watchHours >= 4000;

        // Reply with result
        let reply = `
📊 Channel: ${channelName}
👤 Subscribers: ${subs}
👁 Views: ${views}
💰 Monetized: ${isMonetized ? "Yes ✅" : "No ❌"}
        `;
        conn.reply(m.chat, reply, m);

    } catch (e) {
        conn.reply(m.chat, "Error fetching channel analytics. Make sure the URL is correct.", m);
        console.error(e);
    }
};

handler.help = ['ytchannelstats'];
handler.tags = ['tools'];
handler.command = ['ytchannelstats'];
handler.limit = true;

export default handler;
