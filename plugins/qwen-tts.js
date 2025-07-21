// plugin by noureddine Ouafy
// scrape by rynn-stuff

import axios from 'axios';

/**
 * Generates audio from text using the Qwen TTS API.
 * @param {string} text The text to convert to speech.
 * @param {string} voice The voice to use for the speech synthesis.
 * @returns {Promise<string>} A promise that resolves to the URL of the generated audio.
 */
async function qwentts(text, voice = 'Dylan') {
    try {
        const availableVoices = ['Dylan', 'Sunny', 'Jada', 'Cherry', 'Ethan', 'Serena', 'Chelsie'];
        if (!text) throw new Error('Text is required.');
        if (!availableVoices.includes(voice)) throw new Error(`Invalid voice. Available voices: ${availableVoices.join(', ')}`);

        const session_hash = Math.random().toString(36).substring(2);

        // Queue the TTS generation task
        await axios.post(`https://qwen-qwen-tts-demo.hf.space/gradio_api/queue/join?`, {
            data: [text, voice],
            event_data: null,
            fn_index: 2,
            trigger_id: 13,
            session_hash: session_hash
        });

        // Poll for the result
        const { data } = await axios.get(`https://qwen-qwen-tts-demo.hf.space/gradio_api/queue/data?session_hash=${session_hash}`);

        // Parse the stream data to find the result URL
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                const eventData = JSON.parse(line.substring(6));
                if (eventData.msg === 'process_completed') {
                    // Return the URL of the generated audio file
                    return eventData.output.data[0].url;
                }
            }
        }
        return null; // Return null if the audio URL was not found
    } catch (error) {
        console.error("Error in qwentts function:", error);
        throw new Error(error.message);
    }
}

// --- Handler Code ---

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const availableVoices = ['Dylan', 'Sunny', 'Jada', 'Cherry', 'Ethan', 'Serena', 'Chelsie'];
    let [voice, ...queryParts] = text.split(' ');
    let query = queryParts.join(' ');

    // Check if the first argument is a valid voice. If not, use a default.
    if (!availableVoices.includes(voice)) {
        voice = 'Dylan'; // Set default voice
        query = text;    // The entire text is the query
    }

    if (!query) {
        return m.reply(`*Usage:* ${usedPrefix + command} [voice] <text>\n\n*Example:* ${usedPrefix + command} Serena Hello from Gemini\n\n*Available Voices:* ${availableVoices.join(', ')}`);
    }

    try {
        await m.reply(`🎙️ Generating audio with voice '${voice}'...`);

        const audioUrl = await qwentts(query, voice);

        if (audioUrl) {
            // Send the audio file as a voice note (ptt: true)
            await conn.sendFile(m.chat, audioUrl, 'tts.mp3', null, m, true, {
                type: 'audioMessage',
                ptt: true
            });
        } else {
            await m.reply('❌ Failed to generate audio. The API may be busy or unavailable.');
        }
    } catch (e) {
        console.error(e);
        await m.reply(`An error occurred: ${e.message}`);
    }
};

handler.help = ['qwen-tts'];
handler.command = ['qwen-tts'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
