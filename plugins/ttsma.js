// @instagram: noureddine_ouafy
// scrape by daffa 
import axios from 'axios';

const speechma = {
    api: {
        base: 'https://speechma.com/com.api',
        endpoints: {
            tts: '/tts-api.php',
            audio: (jobId) => `/tts-api.php/audio/${jobId}`
        }
    },
    headers: {
        'authority': 'speechma.com',
        'origin': 'https://speechma.com',
        'referer': 'https://speechma.com/',
        'user-agent': 'Postify/1.0.0'
    },
    available: {
        voices: {
            multilingual: [
                { id: 'voice-107', name: 'Andrew Multilingual', gender: 'Male', language: 'Multilingual', country: 'United States' },
                { id: 'voice-110', name: 'Ava Multilingual', gender: 'Female', language: 'Multilingual', country: 'United States' },
                { id: 'voice-112', name: 'Brian Multilingual', gender: 'Male', language: 'Multilingual', country: 'United States' },
                { id: 'voice-115', name: 'Emma Multilingual', gender: 'Female', language: 'Multilingual', country: 'United States' }
            ]
        }
    },
    getAll: () => {
        return [
            ...speechma.available.voices.multilingual
        ];
    },
    getId: (name) => {
        const voice = speechma.getAll().find(v => 
            v.name.toLowerCase() === name.toLowerCase()
        );
        return voice ? voice.id : null;
    },
    byId: (voiceId) => {
        const voice = speechma.getAll().find(voice => voice.id === voiceId);
        return voice ? {
            id: voice.id,
            name: voice.name,
            gender: voice.gender,
            language: voice.language,
            country: voice.country
        } : null;
    },
    generate: async (text, voice = "Ava Multilingual", options = {}) => {
        try {
            if (!text || text.trim() === '') {
                return { success: false, code: 400, result: { error: "النص فارغ" } };
            }

            let voiceId = voice;
            if (!voice.startsWith('voice-')) {
                voiceId = speechma.getId(voice);
                if (!voiceId) {
                    return { success: false, code: 400, result: { error: `الصوت "${voice}" غير موجود` } };
                }
            }

            const response = await axios.post(
                `${speechma.api.base}${speechma.api.endpoints.tts}`,
                {
                    text,
                    voice: voiceId,
                    pitch: options.pitch || 0,
                    rate: options.rate || 0,
                    volume: options.volume || 100
                },
                { headers: speechma.headers }
            );

            if (!response.data.success) {
                return { success: false, code: response.status || 400, result: { error: response.data.message || 'خطأ في الطلب' } };
            }

            const jobId = response.data.data.job_id;
            await new Promise(resolve => setTimeout(resolve, 2000));
            const link = `${speechma.api.base}${speechma.api.endpoints.audio(jobId)}`;
            return {
                success: true,
                code: 200,
                result: {
                    url: link,
                    text
                }
            };

        } catch (error) {
            return {
                success: false,
                code: error.response?.status || 400,
                result: { error: error.message || 'فشل الاتصال' }
            };
        }
    }
};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`اكتب النص الذي تريد تحويله إلى صوت.\nمثال:\n${usedPrefix + command} السلام عليكم`);
    }

    const voiceName = 'Ava Multilingual'; // يمكنك تغييره أو جعله اختيارياً لاحقاً

    const res = await speechma.generate(text, voiceName);

    if (!res.success) {
        return m.reply(`حدث خطأ:\n${res.result.error}`);
    }

    await conn.sendFile(m.chat, res.result.url, 'speechma.mp3', null, m);
};

handler.help = handler.command = ['ttsma'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
