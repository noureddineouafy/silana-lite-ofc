import fetch from 'node-fetch';

/**
 * This code is provided for educational purposes.
 * Scraping may be against the terms of service of the website.
 * Use it at your own risk.
 * @author wolep
 * plugin by noureddine ouafy
 */

const gemini = {
    getNewCookie: async function () {
        const r = await fetch("https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c", {
            "headers": {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            "body": "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
            "method": "POST"
        });
        console.log('Successfully retrieved a new cookie.');
        const cookieHeader = r.headers.get('set-cookie');
        if (!cookieHeader) throw new Error('Could not find "set-cookie" header in the response.');
        return cookieHeader.split(';')[0];
    },

    ask: async function (prompt, previousId = null) {
        if (typeof (prompt) !== "string" || !prompt?.trim()?.length) {
            throw new Error(`Invalid prompt provided.`);
        }

        let resumeArray = null;
        let cookie = null;

        if (previousId) {
            try {
                const s = atob(previousId);
                const j = JSON.parse(s);
                resumeArray = j.newResumeArray;
                cookie = j.cookie;
            } catch (e) {
                console.error("Failed to parse previousId, starting a new conversation.", e);
                previousId = null; 
            }
        }
        
        const headers = {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "x-goog-ext-525001261-jspb": "[1,null,null,null,\"9ec249fc9ad08861\",null,null,null,[4]]",
            "cookie": cookie || await this.getNewCookie()
        };

        const b = [[prompt], ["en-US"], resumeArray];
        const a = [null, JSON.stringify(b)];
        const obj = { "f.req": JSON.stringify(a) };
        const body = new URLSearchParams(obj);
        
        const response = await fetch(`https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c`, {
            headers,
            body,
            'method': 'post'
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${await response.text() || `(Empty response body)`}`);
        }
        
        const data = await response.text();
        const match = data.matchAll(/^\d+\n(.+?)\n/gm);
        
        // **NEW ROBUST PARSING LOGIC**
        const chunks = Array.from(match, m => m[1]);
        let text, newResumeArray;
        let found = false;

        // Iterate through response chunks from the end to find the valid one.
        for (const chunk of chunks.reverse()) {
            try {
                const realArray = JSON.parse(chunk);
                const parse1 = JSON.parse(realArray[0][2]);
                
                // Check if the expected data structure for the answer exists.
                if (parse1 && parse1[4] && parse1[4][0] && parse1[4][0][1] && typeof parse1[4][0][1][0] === 'string') {
                    newResumeArray = [...parse1[1], parse1[4][0][0]];
                    text = parse1[4][0][1][0].replace(/\*\*(.+?)\*\*/g, `*$1*`);
                    found = true;
                    break; // Exit loop once the correct chunk is found and parsed.
                }
            } catch (e) {
                // Ignore chunks that don't parse correctly and continue.
            }
        }

        if (!found) {
            throw new Error("Could not parse the response from the API. The response structure may have changed.");
        }
        
        const id = btoa(JSON.stringify({ newResumeArray, cookie: headers.cookie }));
        return { text, id };
    }
};

const geminiSessions = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Please enter a prompt. \n\n*Example:* ${usedPrefix + command} Hello, what is the capital of Australia?`;

    if (text.toLowerCase() === '--reset') {
        delete geminiSessions[m.sender];
        return m.reply('🤖 Conversation history has been reset.');
    }
    
    try {
        await m.reply('🤔 Thinking...');
        
        const previousId = geminiSessions[m.sender];
        const result = await gemini.ask(text, previousId);
        geminiSessions[m.sender] = result.id;
        await conn.reply(m.chat, result.text, m);

    } catch (e) {
        console.error(e);
        m.reply(`Sorry, an error occurred while processing your request. Please try again.\n\n*Error:* ${e.message}`);
    }
};

handler.help = ['gemini'];
handler.tags = ['ai'];
handler.command = /^(gemini)$/i;
handler.limit = true;

export default handler;
