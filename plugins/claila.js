import axios from 'axios';

const models = [
  "chatgpt41mini",
  "chatgpt",
  "chatgpto1p",
  "claude",
  "gemini",
  "mistral",
  "grok"
];

// Fetch CSRF token needed for subsequent requests
async function getCsrfToken() {
  const res = await axios.get('https://app.claila.com/api/v2/getcsrftoken', {
    headers: {
      'authority': 'app.claila.com',
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'origin': 'https://www.claila.com',
      'referer': 'https://www.claila.com/',
      'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
    }
  });
  return res.data;
}

// Send message to chosen model and get response
async function sendMessageToModel(model, message = 'hi') {
  const csrfToken = await getCsrfToken();

  const res = await axios.post(
    `https://app.claila.com/api/v2/unichat1/${model}`, // Use the model dynamically
    new URLSearchParams({
      'calltype': 'completion',
      'message': message,
      'sessionId': Date.now().toString()
    }),
    {
      headers: {
        'authority': 'app.claila.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://app.claila.com',
        'referer': 'https://app.claila.com/chat?uid=5044b9eb&lang=en',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest'
      }
    }
  );

  return res.data;
}

// Command handler
export async function handler(m, { conn, usedPrefix, command, text }) {
  if (!text) {
    return m.reply(`Please provide a question!\n\nExample:\n${usedPrefix + command} your_question`);
  }

  await m.reply('Processing...');

  // Get the last model from the list (you can customize the logic here)
  const model = models.pop() || 'chatgpt41mini';

  try {
    const response = await sendMessageToModel(model, text);

    await conn.sendMessage(m.chat, {
      text: `*Response from ${model}*\n\n${typeof response === 'string' ? response : JSON.stringify(response, null, 2)}`
    });
  } catch (error) {
    console.error(error);
    await m.reply('Sorry, an error occurred while processing your request.');
  }
}

handler.help = ['claila'];
handler.tags = ['ai'];
handler.command = ['claila'];
handler.limit = true ;
handler.register = false;
export default handler
