// plugin by noureddine Ouafy 
// scrape by SaaOffc
import axios from 'axios';

/**
 * Scrapes profile information and tweets for a given Twitter (X) username.
 * @param {string} username The Twitter handle to search for.
 * @returns {Promise<object>} An object containing the user's profile and tweets.
 */
async function stalkTwit(username) {
  if (!username) throw new Error('Please provide a username.');

  const url = `https://twittermedia.b-cdn.net/viewer/?data=${encodeURIComponent(username)}&type=profile`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Origin': 'https://snaplytics.io',
    'Referer': 'https://snaplytics.io/'
  };

  try {
    const { data } = await axios.get(url, { headers });
    const { profile, tweets } = data;

    if (!profile) throw new Error('Profile not found or the API is down.');
    
    // Process and return the data in a structured format
    return {
      profile: {
        name: profile.name ?? 'N/A',
        username: profile.username ?? 'N/A',
        bio: profile.bio ?? 'No bio provided.',
        avatar: profile.avatar_url ?? '',
        banner: profile.banner_url ?? '',
        stats: {
          tweets: profile.stats?.tweets ?? 0,
          following: profile.stats?.following ?? 0,
          followers: profile.stats?.followers ?? 0
        }
      },
      tweets: (tweets ?? []).map(tweet => ({
        id: tweet.id ?? '',
        text: tweet.text ?? '',
        date: tweet.created_at ?? '',
        stats: {
          replies: tweet.stats?.replies ?? 0,
          retweets: tweet.stats?.retweets ?? 0,
          likes: tweet.stats?.likes ?? 0,
          views: tweet.stats?.views ?? 0
        },
        media: tweet.media || []
      }))
    };
  } catch (err) {
    console.error('StalkTwit Error:', err?.message || err);
    throw new Error(`Failed to fetch data for "${username}". The profile might be private or does not exist.`);
  }
}

// The handler that will be used as a command
let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`*Usage:* .twitstalk <username>\n*Example:* .twitstalk mrbeast`);
  }

  try {
    await m.reply('🔍 Searching for the profile, please wait...');

    const result = await stalkTwit(text.trim());
    const { profile, tweets } = result;

    // Format the profile information and the latest tweet into a caption
    let caption = `
👤 *Name:* ${profile.name}
*Username:* @${profile.username}
*Bio:* ${profile.bio}

*📊 Stats:*
- *Followers:* ${profile.stats.followers.toLocaleString()}
- *Following:* ${profile.stats.following.toLocaleString()}
- *Tweets:* ${profile.stats.tweets.toLocaleString()}

${'─'.repeat(30)}

`;

    if (tweets.length > 0) {
      const latestTweet = tweets[0];
      caption += `
📝 *Latest Tweet:*
${latestTweet.text}

*📅 Date:* ${new Date(latestTweet.date).toLocaleString('en-US')}
*❤️ Likes:* ${latestTweet.stats.likes.toLocaleString()} | *🔁 Retweets:* ${latestTweet.stats.retweets.toLocaleString()} | *👁️ Views:* ${latestTweet.stats.views.toLocaleString()}`;
    } else {
      caption += "No recent tweets found.";
    }

    // Send the profile picture with the formatted caption
    await conn.sendFile(m.chat, profile.avatar, 'twitter_profile.jpg', caption, m);

  } catch (error) {
    console.error(error);
    await m.reply(`❌ An error occurred: ${error.message}`);
  }
};

// Handler configuration
handler.help = ['twitstalk'];
handler.command = ['twitstalk','xstalk'];
handler.tags = ['search'];
handler.limit = true;
export default handler;
