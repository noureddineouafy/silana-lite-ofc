// @noureddine_ouafy
// Command: .aichat <message>
// Scrapes unofficial AI model responses (FreeBotiAIChat base)

import crypto from 'crypto';

const openai = {
  models: [
    "gpt-4.1", "gpt-4.1-nano", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini",
    "o1", "o1-mini", "o3-mini", "o4-mini", "o3", "gpt-4.5-preview",
    "chatgpt-4o-latest", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"
  ],
  n: "",
  s: async () => {
    const body = JSON.stringify({ clientType: "CLIENT_TYPE_ANDROID" });

    const res = await fetch(
      'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyDcCVo5afkPL40sKBf8j3ZACpiDGU74xj4',
      {
        method: 'POST',
        headers: {
          'User-Agent': 'TheFUCK/2.1.0 (Windows; U; Android 99; itel Apalo Build/SBY.9SJU9.1909)',
          'Connection': 'Keep-Alive',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US'
        },
        body
      }
    );
    const json = await res.json();
    return json.idToken;
  },
  t: async (token, deviceId) => {
    const body = JSON.stringify({ data: { deviceid: deviceId } });

    const res = await fetch('https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotisTrialActive2', {
      method: 'POST',
      headers: {
        'User-Agent': 'okhttp/3.12.13',
        'Accept-Encoding': 'gzip',
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json; charset=utf-8'
      },
      body
    });

    const json = await res.json();
    openai.n = token;
    return json.result.trialActive;
  },
  chat: async ({ model, messages }) => {
    try {
      if (!openai.models.includes(model)) throw new Error("Invalid model.");
      if (!messages || !messages.length) throw new Error("Empty messages payload.");

      let token;
      const deviceId = crypto.randomBytes(32).toString('hex');

      if (!openai.n) {
        token = await openai.s();
        await openai.t(token, deviceId);
      } else {
        token = openai.n;
      }

      if (!token) throw new Error("Failed to get token.");

      const payload = JSON.stringify({
        data: JSON.stringify({
          content: "Hi",
          chatmodel: model,
          messages,
          stream: false,
          deviceid: deviceId,
          subscriberid: "$RCAnonymousID:475151fd351f4d109829a83542725c78",
          subscribed: true
        })
      });

      const res = await fetch('https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotai2', {
        method: 'POST',
        headers: {
          'User-Agent': 'okhttp/3.12.13',
          'Accept-Encoding': 'gzip',
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json; charset=utf-8'
        },
        body: payload
      });

      const json = await res.json();
      return json.result.response.choices[0].message.content;
    } catch (e) {
      return `❌ Error: ${e.message}`;
    }
  }
};

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply('🧠 Please provide a prompt.\nExample: .aichat What is the capital of Morocco?');

  const response = await openai.chat({
    model: 'o4-mini',
    messages: [{ role: "user", content: text }]
  });

  m.reply(response);
};

handler.help = handler.command = ['aichat'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
