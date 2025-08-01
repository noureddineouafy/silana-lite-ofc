//plugin by noureddine ouafy 
// scrape by GilangSan

import axios from 'axios';
import cheerio from 'cheerio';

/**
 * Text-to-Speech (TTS) Plugin
 * Command: .say
 * Supports multiple languages with a focus on Arabic narrators.
 * Last Updated: August 1, 2025
 */

// --- Helper Functions (Do not modify) ---
async function getToken() {
    const res = await axios.get('https://crikk.com/text-to-speech');
    const $ = cheerio.load(res.data);
    const token = $('input[name=_token]').val();
    return {
        cookie: res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; '),
        token
    };
}

async function tts(text, voice, language = 'Indonesia') {
    if (!text) throw new Error('Please provide text for TTS.');
    if (!voice) throw new Error('Please provide a voice model.');
    
    const { token, cookie } = await getToken();
    const form = new URLSearchParams();
    form.append('text', text);
    form.append('language', language);
    form.append('voice', voice);
    form.append('_token', token);

    const { data } = await axios.post('https://crikk.com/app/generate-audio-frontend', form, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://crikk.com',
            'Referer': 'https://crikk.com/text-to-speech',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Cookie': cookie
        }
    });

    if (data.audio) {
        return Buffer.from(data.audio.split('base64,')[1], 'base64');
    } else {
        throw new Error('Failed to generate audio from the API.');
    }
}
// --- End Helper Functions ---


// --- Voice Mapping ---
// Maps simple names to their technical API names and language descriptions.
const voiceMap = {
    // Arabic Voices
    'hamed':    { name: 'ar-SA-HamedNeural',      lang: 'Arabic (Male)' },
    'zariyah':  { name: 'ar-SA-ZariyahNeural',    lang: 'Arabic (Female)' },
    // English Voices
    'andrew':   { name: 'en-US-AndrewMultilingualNeural', lang: 'English, US (Male)' },
    'ava':      { name: 'en-US-AvaMultilingualNeural',    lang: 'English, US (Female)' },
    'brian':    { name: 'en-US-BrianMultilingualNeural',  lang: 'English, US (Male)' },
    'emma':     { name: 'en-US-EmmaMultilingualNeural',   lang: 'English, US (Female)' },
    // Other Multilingual Voices
    'remy':     { name: 'fr-FR-RemyMultilingualNeural',   lang: 'French (Male)' },
    'vivienne': { name: 'fr-FR-VivienneMultilingualNeural', lang: 'French (Female)' },
    'florian':  { name: 'de-DE-FlorianMultilingualNeural',lang: 'German (Male)' },
    'ardi':     { name: 'id-ID-ArdiNeural',       lang: 'Indonesian (Male)' },
    'gadis':    { name: 'id-ID-GadisNeural',      lang: 'Indonesian (Female)' }
};


// --- Main Handler ---
let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Generate the list of voices with their languages
    const voiceList = Object.entries(voiceMap)
        .map(([key, value]) => `› *${key}* (${value.lang})`)
        .join('\n');
        
    // Generate the complete help message with the new Arabic example
    const helpMessage = `🎙️ Please use the correct format to generate audio.\n\n*Example:*\n${usedPrefix + command} hamed السلام عليكم ورحمة الله\n\n*Available Voices:*\n${voiceList}`;

    // Check if user provided enough arguments
    if (args.length < 2) {
        return m.reply(helpMessage);
    }

    const voiceKey = args[0].toLowerCase();
    const voiceData = voiceMap[voiceKey];

    // Check if the provided voice name is valid
    if (!voiceData) {
        return m.reply(`Voice "${args[0]}" not found.\n\n${helpMessage}`);
    }

    const textToSpeak = args.slice(1).join(' ');

    try {
        await m.reply(`🔊 Generating audio with *${voiceKey}*'s voice, please wait...`);
        
        // Call the TTS function with the selected voice name
        const audioBuffer = await tts(textToSpeak, voiceData.name);

        // Send the audio file
        conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false // Set to true to send as a voice note
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ An error occurred: ${e.message}`);
    }
};

handler.help = ['say'];
handler.tags = ['tools'];
handler.command = ['say'];
handler.limit = true;

export default handler;
