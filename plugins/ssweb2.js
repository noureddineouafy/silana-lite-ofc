// plugin by noureddine ouafy 
// scrape by wolfyflutter

let handler = async (m, { conn, text, usedPrefix, command }) => {
    
    // --- 1. Argument and URL Validation ---
    if (!text) {
        return conn.reply(m.chat, `**Usage:** ${usedPrefix}${command} <url>\n\n*Example:*\n${usedPrefix}${command} https://www.google.com`, m);
    }

    let url;
    try {
        // Ensure the URL is valid and prepend https:// if missing
        url = new URL(text.startsWith('http') ? text : `https://${text}`);
    } catch (e) {
        return conn.reply(m.chat, '*Invalid URL format.* Please make sure the link is correct.', m);
    }

    // --- 2. Screenshot Web Function ---
    /**
     * Captures a screenshot of the provided URL using the pikwy API.
     * @param {string} targetUrl The URL to capture.
     * @returns {Promise<object>} The API response containing the screenshot data.
     */
    async function ssweb(targetUrl) {
        
        // **FIX 1: Removed 'require' to use the global 'fetch' API**
        
        const payload = {
            tkn: 125,
            d: 3000,
            u: encodeURIComponent(targetUrl),
            fs: 0,
            w: 1280, // Width
            h: 720,  // Height
            s: 100,
            z: 100,
            f: "png", // Output format
            rt: "jweb"
        }

        const r = await fetch("https://api.pikwy.com/?" + new URLSearchParams(payload));
        
        // Throw an error if the HTTP request itself failed (e.g., 404, 500)
        if (!r.ok) throw new Error(`${r.status} ${r.statusText} | ${await r.text()}`);

        return await r.json();
    }

    // --- 3. Execution and Response Handling ---
    try {
        await conn.reply(m.chat, '*Generating screenshot... please wait.*', m);
        const result = await ssweb(url.href);
        
        // **FIX 2: Check for 'iurl' (Image URL) instead of 'result.status'**
        if (result.iurl) {
            // The API returns the direct image URL in the 'iurl' field
            await conn.sendFile(
                m.chat, 
                result.iurl, // Use the correct key: iurl
                'screenshot.png', 
                `✅ *Screenshot for:* ${url.hostname}\n\n*Captured on:* ${result.date}`, 
                m
            );
        } else {
            // This handles unexpected successful responses that still lack an image URL
            await conn.reply(m.chat, `❌ *Failed to retrieve image URL.* \nAPI Response: ${JSON.stringify(result, null, 2)}`, m);
        }

    } catch (e) {
        console.error('SSWEB Error:', e);
        // Send a user-friendly error message
        await conn.reply(m.chat, `*An error occurred while processing the request:*\n\n${e.message}`, m);
    }
}

// --- 4. Handler Metadata ---
handler.help = ['ssweb2'];
handler.command = ['ssweb2'];
handler.tags = ['tools']; 

handler.limit = true;

export default handler;
