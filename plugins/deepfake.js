import ws from 'ws';

/**
 * @type {import('@adiwajshing/baileys').AnyWASocket}
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!/image/g.test(mime)) {
            throw `⚠️ Please reply to an image to use this command.\n\n📌 Example:\n${usedPrefix + command} a man wearing a Real Madrid t-shirt\n\n📌 مثال:\n${usedPrefix + command} شخص يرتدي قميص المغرب`;
        }

        await m.reply('⏳ Please wait while processing your request...');

        // 🧠 User prompt or default fallback
        let prompt = text?.trim() || 'A person wearing a Real Madrid t-shirt';
        let imgBuffer = await q.download();
        let resultUrl = await deepfake(imgBuffer, prompt);

        await conn.sendMessage(m.chat, {
            image: { url: resultUrl },
            caption: `✅ *Prompt Used:* ${prompt}`
        }, { quoted: m });

    } catch (e) {
        await m.reply(`❌ Error:\n${e.toString()}`);
    }
};

handler.help = ['deepfake'];
handler.tags = ['ai'];
handler.command = ['deepfake'];
handler.limit = true;

export default handler;

async function deepfake(buffer, prompt = 'A person wearing a Real Madrid t-shirt') {
    if (!prompt || !buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Prompt and image buffer are required.');
    }

    const session_hash = Math.random().toString(36).substring(2);
    const socket = new ws('wss://deepfakemaker.io/cloth-change/queue/join');

    return new Promise((resolve, reject) => {
        socket.on('message', (data) => {
            try {
                const d = JSON.parse(data.toString('utf8'));

                switch (d.msg) {
                    case 'send_hash':
                        socket.send(JSON.stringify({ session_hash }));
                        break;

                    case 'send_data':
                        socket.send(JSON.stringify({
                            data: {
                                prompt,
                                request_from: 4,
                                source_image: `data:image/jpeg;base64,${buffer.toString('base64')}`,
                                type: 1
                            }
                        }));
                        break;

                    case 'process_completed':
                        socket.close();
                        if (d.output?.result?.[0]) {
                            resolve(`https://res.deepfakemaker.io/${d.output.result[0]}`);
                        } else {
                            reject(new Error('The server did not return an image.'));
                        }
                        break;

                    case 'queue_full':
                        socket.close();
                        reject(new Error('Server is busy. Try again later.'));
                        break;
                }
            } catch (err) {
                socket.close();
                reject(err);
            }
        });

        socket.on('error', (err) => {
            socket.close();
            reject(err);
        });
    });
}
