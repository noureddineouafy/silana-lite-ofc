// plugin by noureedine Ouafy 
// scrape by GilangSan
// edit image using Ai 

import axios from 'axios';

/**
 * Helper function to generate a random session ID.
 */
function generateId(length = 11) {
    let id = '';
    while (id.length < length) {
        id += Math.random().toString(36).slice(2);
    }
    return id.slice(0, length);
}

/**
 * Parses the server-sent event stream to find the final result.
 */
function parseEventStream(rawText) {
  const lines = rawText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonPart = line.slice(6); // Remove "data: "
      try {
        const data = JSON.parse(jsonPart);
        // We only care about the final processed data
        if (data.msg === 'process_completed') {
          return data; 
        }
      } catch (err) {
        console.error('JSON parse error:', err);
      }
    }
  }
  return null; // Return null if no 'process_completed' message is found
}

/**
 * Main function to upload, process, and retrieve the edited image.
 * @param {Buffer} imageBuffer The image to edit.
 * @param {string} prompt The editing instruction.
 * @returns {Promise<string|null>} The URL of the edited image or null on failure.
 */
async function editImage(imageBuffer, prompt) {
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    let form = new FormData();
    form.append('files', file);

    const sessionHash = generateId();
    const uploadId = generateId();

    // 1. Upload the image file
    const { data: uploadData } = await axios.post(`https://taesiri-gemini-text-based-image-editor.hf.space/gradio_api/upload?upload_id=${uploadId}`, form);
    const filePath = uploadData[0];

    // 2. Join the processing queue
    await axios.post(`https://taesiri-gemini-text-based-image-editor.hf.space/gradio_api/queue/join?__theme=system`, {
        "data": [
            {
                "path": filePath,
                "url": `https://taesiri-gemini-text-based-image-editor.hf.space/gradio_api/file=${filePath}`,
                "orig_name": "image.jpg",
                "size": imageBuffer.length,
                "mime_type": "image/jpeg",
                "meta": { "_type": "gradio.FileData" }
            },
            prompt
        ],
        "event_data": null,
        "fn_index": 0,
        "trigger_id": 8,
        "session_hash": sessionHash
    });

    // 3. Poll for the result data
    const { data: resultStream } = await axios.get(`https://taesiri-gemini-text-based-image-editor.hf.space/gradio_api/queue/data?session_hash=${sessionHash}`);
    
    const result = parseEventStream(resultStream);

    if (result && result.output.data[0]) {
        return result.output.data[0].url;
    } else {
        return null;
    }
}


// #region Handler
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Check for quoted image and prompt text
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';
    if (!/image/g.test(mime)) {
        return m.reply(`Please reply to an image and provide instructions.\n\n*Example:*\n${usedPrefix + command} remove the background`);
    }
    if (!text) {
        return m.reply(`What should I do with the image? Provide instructions.\n\n*Example:*\n${usedPrefix + command} make it black and white`);
    }

    await m.reply('✨ Editing your image with AI, please wait...');

    try {
        // Download the image buffer from the message
        let imgBuffer = await q.download();
        
        // Call the editing function
        let resultUrl = await editImage(imgBuffer, text);

        if (resultUrl) {
            // Send the edited image back to the user
            await conn.sendFile(m.chat, resultUrl, 'edited.jpg', `*Here is your edited image.*\n\n*Prompt:* ${text}`, m);
        } else {
            await m.reply('❌ Sorry, I couldn\'t process the image. The API may have failed.');
        }

    } catch (e) {
        console.error(e);
        await m.reply('An unexpected error occurred. Please try again later.');
    }
};

handler.help = ['editimg'];
handler.command = ['editimg'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
// #endregion
