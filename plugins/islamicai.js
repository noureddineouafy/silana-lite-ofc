/* • Scrape Islamic AI
• Adapted for WhatsApp Bot by Gemini
• Original Author : SaaOfc's
*/

import axios from 'axios';

/**
 * This handler processes user questions and gets answers from an Islamic AI API.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Check if the user provided a question. If not, send instructions.
  if (!text) {
    throw `Please provide a question to ask the AI.\n\n*Example Usage:*\n${usedPrefix + command} what is the ruling on fasting?`;
  }

  try {
    // Let the user know the request is being processed.
    await conn.reply(m.chat, '⏳ Please wait, seeking knowledge...', m);

    // Make a POST request to the Islamic AI API.
    const response = await axios.post(
      'https://vercel-server-psi-ten.vercel.app/chat',
      {
        // The user's question.
        text,
        // The API seems to require this array structure with context.
        array: [
          {
            content: "What is Islam? Tell with reference to a Quran Ayat and explanation.",
            text: text
          }
        ]
      },
      {
        // Headers to mimic a request from the official website.
        headers: {
          'Content-Type': 'application/json',
          'origin': 'https://islamandai.com',
          'referer': 'https://islamandai.com',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      }
    );

    // Check if the response data and result exist.
    if (response.data && response.data.result) {
      // Send the AI's answer back to the user.
      await conn.reply(m.chat, response.data.result, m);
    } else {
      // Handle cases where the API response is not in the expected format.
      throw 'The AI did not provide a valid response. Please try again later.';
    }

  } catch (err) {
    // Log the full error for debugging purposes.
    console.error('Islamic AI API Error:', err);

    // Extract a user-friendly error message.
    const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
    
    // Inform the user that an error occurred.
    await conn.reply(m.chat, `Sorry, an error occurred while contacting the AI.\n*Error:* ${errorMessage}`, m);
  }
};

// Define how the command can be triggered.
handler.command = /^(islamicai)$/i;

// Provide help text for the bot's menu.
handler.help = ['islamicai'];

// Categorize the command.
handler.tags = ['ai'];

// Apply usage limits if configured.
handler.limit = true;

// Export the handler for the bot to use.
export default handler;
