// plugin by noureddine ouafy
// scrape by SaaOfc


import axios from 'axios';

/**
 * This is the core scraping function that fetches the transcript from a TikTok video URL.
 * @param {string} videoUrl - The URL of the TikTok video.
 * @returns {Promise<object>} - A promise that resolves to an object containing the transcript data.
 */
const getTikTokTranscript = async (videoUrl) => {
  try {
    // Make a POST request to the Short.ai API endpoint.
    const { data: response } = await axios.post(
      'https://www.short.ai/self-api/v2/project/get-tiktok-youtube-link',
      {
        link: videoUrl
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://www.short.ai',
          'Referer': 'https://www.short.ai/tiktok-script-generator',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        }
      }
    );

    // Extract the relevant data from the API response.
    const data = response?.data?.data;
    if (!data || !data.text) {
      // Throw an error if the expected data is not found.
      throw new Error('Could not retrieve transcript. The URL might be invalid or the video may not have a transcript.');
    }

    // Return a structured object with the transcript details.
    return {
      text: data.text,
      duration: data.duration,
      language: data.language,
      url: response?.data?.url,
      segments: data.segments.map(s => ({
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };

  } catch (err) {
    // Log the detailed error and re-throw a user-friendly message.
    console.error('TikTok Transcript Error:', err.response?.data || err.message);
    // Use the error message from the API if available, otherwise provide a generic one.
    const errorMessage = err.response?.data?.message || 'Failed to fetch the transcript. Please check the URL and try again.';
    throw new Error(errorMessage);
  }
};


/**
 * This is the bot handler that processes the user's command.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Check if the user provided a URL.
  if (!text) {
    throw `Please provide a TikTok video URL.\n\n*Example:*\n${usedPrefix + command} https://www.tiktok.com/@beyar12/video/7481362831888157973`;
  }

  // A simple regex to validate if the input looks like a TikTok URL.
  const tiktokUrlRegex = /tiktok\.com/i;
  if (!tiktokUrlRegex.test(text)) {
    throw `The provided URL does not seem to be a valid TikTok link.`;
  }

  try {
    // Inform the user that the process is starting.
    await m.reply('📄 Fetching transcript from TikTok... Please wait.');

    // Call the scraping function with the user's URL.
    const result = await getTikTokTranscript(text);

    // Format the result for a clean reply.
    const replyText = `
*TikTok Video Transcript*

*Language:* ${result.language}
*Duration:* ${result.duration} seconds

📜 *Full Transcript:*
${result.text}
    `.trim();

    // Send the formatted transcript to the user.
    await m.reply(replyText);

  } catch (error) {
    // Catch and display any errors that occurred during the process.
    console.error(error);
    await m.reply(`Sorry, an error occurred:\n${error.message}`);
  }
};

// --- Handler Configuration ---
handler.help = ['tiktoktranscript'];
handler.command = /^(tiktoktranscript)$/i;
handler.tags = ['tools'];
handler.limit = true; // This command makes an external API call.
handler.premium = false;

export default handler;
