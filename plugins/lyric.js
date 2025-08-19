// plugin by Noureddine Ouafy 
// scrape by NekoLabs

import axios from 'axios';

/**
 * Searches for lyrics on lrclib.net.
 * @param {string} title The title of the song to search for.
 * @returns {Promise<Object[]>} A promise that resolves to an array of song results.
 */
async function fetchLyrics(title) {
    if (!title) throw new Error('A song title is required.');
    
    // The API endpoint for searching lyrics.
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`;
    
    // Making the GET request to the API.
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
    });
    
    return data;
}


// Define the main command handler.
const handler = async (m, { conn, text }) => {
    // Check if the user provided a song title.
    if (!text) {
        return m.reply('Please provide a song title to search for.\n\n*Example:* `.lyrics Faded`');
    }

    try {
        // Notify the user that the search has started.
        await m.reply(`Searching for lyrics for "*${text}*"...`);

        // Fetch the lyric search results.
        const results = await fetchLyrics(text);

        // Handle the case where no results are found.
        if (!results || results.length === 0) {
            return m.reply(`Sorry, I couldn't find any lyrics for "*${text}*".`);
        }

        // Select the first (most likely) result.
        const song = results[0];
        
        // Prioritize synced lyrics, but fall back to plain lyrics.
        const lyricsText = song.syncedLyrics || song.plainLyrics;

        // Handle the case where the song entry exists but has no lyrics.
        if (!lyricsText) {
            return m.reply(`Lyrics are not available for "*${song.trackName}*" by *${song.artistName}*.`);
        }
        
        // Format the final response message.
        const response = `*🎶 Lyrics Found!*\n\n*Title:* ${song.trackName}\n*Artist:* ${song.artistName}\n\n---\n\n${lyricsText}`;

        // Send the formatted lyrics to the user.
        m.reply(response);

    } catch (error) {
        // Log the error and notify the user if something goes wrong.
        console.error('Lyrics Fetch Error:', error);
        m.reply('An error occurred while trying to fetch the lyrics. Please try again later.');
    }
};

// --- Handler Configuration ---
handler.help = ['lyric'];
handler.command = ['lyric'];
handler.tags = ['search'];
handler.limit = true; // Enables usage limit for this command.

export default handler;
