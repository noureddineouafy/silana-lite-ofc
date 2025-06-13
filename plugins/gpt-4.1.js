// Supports Image Input

import axios from 'axios';

let handler = async (m, { conn, text }) => {
    new Promise(async (resolve) => {
        let q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        let input;
        let dxyz;

        if (/image/.test(mime)) {
            input = text || 'Do you know this image?';
            dxyz = {
                model: 'gpt-4.1-mini',
                imageBuffer: await q.download()
            };
        } else {
            input = text || 'Hello';
            dxyz = {
                model: 'gpt-4.1-mini'
            };
        }

        await pollai(input, dxyz).then(async (response) => {
            await m.reply(response);
        }).catch(async (err) => {
            await m.reply(' *[ ! ]* Sorry, you might be making too many requests.');
            console.error(err);
        });
    });
};

/**
 * @ ✨ Scrape Pollinations AI (GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, Supports Image Input)
 * @ Base: https://sur.pollinations.ai/
 * @ Thanks to: Andhika (https://whatsapp.com/channel/0029VaAMjXT4yltWm1NBJV3J)
 */

async function pollai(question, {
    systemMessage = null,
    model = 'gpt-4.1-mini',
    imageBuffer = null
} = {}) {
    try {
        const modelList = {
            'gpt-4.1': 'openai-large',
            'gpt-4.1-mini': 'openai',
            'gpt-4.1-nano': 'openai-fast'
        };

        if (!question) throw new Error('Question is required');
        if (!modelList[model]) throw new Error(`Available models: ${Object.keys(modelList).join(', ')}`);

        const messages = [
            ...(systemMessage ? [{
                role: 'system',
                content: systemMessage
            }] : []),
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: question
                    },
                    ...(imageBuffer ? [{
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                        }
                    }] : [])
                ]
            }
        ];

        const { data } = await axios.post('https://text.pollinations.ai/openai', {
            messages,
            model: modelList[model],
            temperature: 0.5,
            presence_penalty: 0,
            top_p: 1,
            frequency_penalty: 0
        }, {
            headers: {
                accept: '*/*',
                authorization: 'Bearer dummy',
                'content-type': 'application/json',
                origin: 'https://sur.pollinations.ai',
                referer: 'https://sur.pollinations.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        return data.choices[0].message.content;
    } catch (error) {
        console.error(error.message);
        throw new Error('No result found');
    }
}

handler.limit = true;

handler.help = ['gpt-4.1'];
handler.tags = ['ai'];
handler.command = ['gpt-4.1'];
handler.limit = true;
export default handler;
