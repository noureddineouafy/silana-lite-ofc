/**
 * @instagram.com/noureddine_ouafy
 * Scrape TikTok Earnings by Username
 * Author: SaaOfc's | Modified by: @noureddine_ouafy
 */

import axios from 'axios';

async function getNonce() {
  const res = await axios.get('https://influencermarketinghub.com/tiktok-money-calculator/', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/html',
    }
  });
  const match = res.data.match(/name="_wpnonce"\s+value="([^"]+)"/);
  if (!match) throw new Error('Failed to get _wpnonce');
  return match[1];
}

async function getTiktokStats(username) {
  const nonce = await getNonce();

  const payload = `action=hypeauditor_tiktok&name=${encodeURIComponent(username)}&_wpnonce=${nonce}&_wp_http_referer=%2Ftiktok-money-calculator%2F`;

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://influencermarketinghub.com',
    'Referer': 'https://influencermarketinghub.com/tiktok-money-calculator/',
    'User-Agent': 'Mozilla/5.0',
    'X-Requested-With': 'XMLHttpRequest'
  };

  const { data } = await axios.post(
    'https://influencermarketinghub.com/wp-admin/admin-ajax.php',
    payload,
    { headers }
  );

  if (!data.success) throw new Error('Failed to fetch TikTok data');

  const avatarBuffer = await axios.get(data.data.avatar_url, {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  }).then(res => res.data);

  return {
    name: data.data.full_name,
    avatarBuffer,
    followers: data.data.followers_count,
    averageLikes: data.data.avg_likes_count,
    posts: data.data.posts_count,
    earnings: data.data.earnings,
    engagement: data.data.engagement
  };
}

// Handler
let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('Please provide a TikTok username.\nExample: .tiktokstat mrbeast');

  try {
    const result = await getTiktokStats(args[0]);

    const message = `
📛 Name: ${result.name}
👥 Followers: ${result.followers}
❤️ Avg Likes: ${result.averageLikes}
📝 Posts: ${result.posts}
💰 Earnings/Post: ${result.earnings}
📊 Engagement Rate: ${result.engagement}
`.trim();

    await conn.sendMessage(m.chat, {
      image: result.avatarBuffer,
      caption: message
    }, { quoted: m });

  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.help = handler.command = ['tiktokstat'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
