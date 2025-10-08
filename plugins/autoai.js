// instagram.com/noureddine_ouafy
import fetch from 'node-fetch';

const gemini = {
  getNewCookie: async function () {
    const r = await fetch("https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c", {
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
      method: "POST"
    });
    const cookieHeader = r.headers.get('set-cookie');
    if (!cookieHeader) throw new Error('Failed to retrieve Gemini cookie.');
    return cookieHeader.split(';')[0];
  },

  ask: async function (prompt, previousId = null) {
    if (!prompt?.trim()) throw new Error("Invalid prompt.");

    let resumeArray = null, cookie = null;
    if (previousId) {
      try {
        const j = JSON.parse(atob(previousId));
        resumeArray = j.newResumeArray;
        cookie = j.cookie;
      } catch {
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
      method: 'POST'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

    const data = await response.text();
    const match = data.matchAll(/^\d+\n(.+?)\n/gm);
    const chunks = Array.from(match, m => m[1]);
    let text, newResumeArray, found = false;

    for (const chunk of chunks.reverse()) {
      try {
        const realArray = JSON.parse(chunk);
        const parse1 = JSON.parse(realArray[0][2]);
        if (parse1?.[4]?.[0]?.[1]?.[0]) {
          newResumeArray = [...parse1[1], parse1[4][0][0]];
          text = parse1[4][0][1][0].replace(/\*\*(.+?)\*\*/g, `*$1*`);
          found = true;
          break;
        }
      } catch {}
    }

    if (!found) throw new Error("Failed to parse Gemini response.");

    const id = btoa(JSON.stringify({ newResumeArray, cookie: headers.cookie }));
    return { text, id };
  }
};

const geminiSessions = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Example:* ${usedPrefix + command} on/off`;

  const phone = m.sender.split('@')[0];
  conn.autoGemini = conn.autoGemini || {};

  if (text === "on") {
    conn.autoGemini[phone] = true;
    m.reply("[ ✓ ] Auto AI mode enabled.");
  } else if (text === "off") {
    delete conn.autoGemini[phone];
    m.reply("[ ✓ ] Auto AI mode disabled.");
  }
};

// 🧠 Auto AI reply logic
handler.before = async (m, { conn }) => {
  conn.autoGemini = conn.autoGemini || {};
  if (m.isBaileys && m.fromMe) return;
  if (!m.text) return;

  const phone = m.sender.split('@')[0];
  if (!conn.autoGemini[phone]) return;
  if (/^[.#/\\!]/.test(m.text)) return;

  try {
    const prev = geminiSessions[m.sender];
    const result = await gemini.ask(m.text, prev);
    geminiSessions[m.sender] = result.id;
    await conn.reply(m.chat, result.text, m);
  } catch (e) {
    console.error(e);
    m.reply("⚠️ Error while contacting Gemini AI. Please try again later.");
  }
};

handler.command = ["autoai"];
handler.tags = ["ai"];
handler.help = ["autoai"];
handler.limit = true;

export default handler;
