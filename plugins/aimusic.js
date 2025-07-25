// plugin by noureddine ouafy 
// scrape by rynn-stuff

import axios from 'axios';

/**
 * This handler uses a two-stage AI process to generate music.
 * 1. Generate lyrics based on a user's prompt.
 * 2. Generate music based on the lyrics and user-provided tags.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // --- Input Parsing ---
    // The input is expected in the format: <prompt> | <tags>
    // The tags part is optional.
    let prompt = text;
    let tags = 'pop, acoustic, happy'; // Default tags
    if (text.includes('|')) {
        const parts = text.split('|');
        prompt = parts[0].trim();
        tags = parts[1].trim();
    }

    if (!prompt) {
        throw `Please provide a song description.\n\n*Example:*\n${usedPrefix + command} a song about a lonely robot in space | cinematic, ambient`;
    }

    try {
        // --- Step 1: Generate Lyrics ---
        await m.reply('✍️ Step 1/2: Generating song lyrics...');

        const { data: lyricsResponse } = await axios.get('https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat', {
            params: {
                query: JSON.stringify([
                    {
                        role: 'system',
                        content: 'You are a professional lyricist AI trained to write poetic and rhythmic song lyrics. Respond with lyrics only, using [verse], [chorus], [bridge], and [instrumental] or [inst] tags to structure the song. Use only the tag (e.g., [verse]) without any numbering or extra text (e.g., do not write [verse 1], [chorus x2], etc). Do not add explanations, titles, or any other text outside of the lyrics. Focus on vivid imagery, emotional flow, and strong lyrical rhythm. Refrain from labeling genre or giving commentary. Respond in clean plain text, exactly as if it were a song lyric sheet.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]),
                link: 'writecream.com'
            }
        });

        const lyrics = lyricsResponse.response_content;
        if (!lyrics) {
            throw new Error('Failed to generate lyrics. The AI might be busy.');
        }

        // --- Step 2: Generate Music ---
        await m.reply(`🎼 Step 2/2: Lyrics generated! Now composing music with tags: *${tags}*. This may take a minute...`);

        const session_hash = Math.random().toString(36).substring(2);
        
        // Join the processing queue on the Hugging Face Space
        await axios.post(`https://ace-step-ace-step.hf.space/gradio_api/queue/join?`, {
            data: [240, tags, lyrics, 60, 15, 'euler', 'apg', 10, '', 0.5, 0, 3, true, false, true, '', 0, 0, false, 0.5, null, 'none'],
            event_data: null,
            fn_index: 11,
            trigger_id: 45,
            session_hash: session_hash
        });

        // Poll the data endpoint until the process is complete
        let audioUrl;
        const maxAttempts = 60; // Poll for a maximum of 2 minutes (60 * 2s)
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds between checks

            const { data: queueData } = await axios.get(`https://ace-step-ace-step.hf.space/gradio_api/queue/data?session_hash=${session_hash}`);
            
            // The response is a stream of server-sent events, we look for the completion message
            const lines = queueData.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const d = JSON.parse(line.substring(6));
                    if (d.msg === 'process_completed') {
                        audioUrl = d.output.data[0].url;
                        break;
                    } else if (d.msg === 'process_failed') {
                        throw new Error('Music generation failed in the queue.');
                    }
                }
            }
            if (audioUrl) break; // Exit loop if we have the URL
        }

        if (!audioUrl) {
            throw new Error('Music generation timed out. Please try again later.');
        }

        // --- Step 3: Send the final audio file ---
        await conn.sendFile(m.chat, audioUrl, 'ai_music.wav', `*Here is your AI-generated song about:* "${prompt}"`, m);

    } catch (error) {
        console.error(error);
        await m.reply(`Sorry, something went wrong:\n${error.message}`);
    }
};

// --- Handler Configuration ---
handler.help = ['aimusic'];
handler.command = /^(aimusic)$/i;
handler.tags = ['ai'];
handler.limit = true;
handler.premium = true; // This is a resource-intensive command

export default handler;
      
