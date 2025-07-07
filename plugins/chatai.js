/**
 * @instagram.com/noureddine_ouafy
 * @plugin: Chat AI
 * scrape by rynn-stuff
 * @base: https://api.appzone.tech/v1/chat/completions
 */

import axios from 'axios';

async function chatai(question, { system_prompt = null, model = 'grok-3-mini' } = {}) {
  try {
    const _model = [
      'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'o4-mini', 'deepseek-r1',
      'deepseek-v3', 'claude-3.7', 'gemini-2.0', 'grok-3-mini', 'qwen-qwq-32b',
      'gpt-4o', 'o3', 'gpt-4o-mini', 'llama-3.3'
    ];

    if (!question) throw new Error('❓ السؤال فارغ');
    if (!_model.includes(model)) throw new Error(`✅ النماذج المتوفرة: ${_model.join(', ')}`);

    const { data } = await axios.post('https://api.appzone.tech/v1/chat/completions', {
      messages: [
        ...(system_prompt ? [{
          role: 'system',
          content: [{ type: 'text', text: system_prompt }]
        }] : []),
        {
          role: 'user',
          content: [{ type: 'text', text: question }]
        }
      ],
      model: model,
      isSubscribed: true
    }, {
      headers: {
        authorization: 'Bearer az-chatai-key',
        'content-type': 'application/json',
        'user-agent': 'okhttp/4.9.2',
        'x-app-version': '3.0',
        'x-requested-with': 'XMLHttpRequest',
        'x-user-id': '$RCAnonymousID:84947a7a4141450385bfd07a66c3b5c4'
      }
    });

    let fullText = '';
    const lines = data.split('\n\n').map(line => line.substring(6));
    for (const line of lines) {
      if (line === '[DONE]') continue;
      try {
        const d = JSON.parse(line);
        fullText += d.choices[0].delta.content;
      } catch { }
    }

    const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
    return {
      think: thinkMatch ? thinkMatch[1].trim() : '',
      response: fullText.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    };
  } catch (error) {
    throw new Error(`❌ خطأ: ${error.message}`);
  }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`✍️ اكتب سؤالك بعد الأمر\nمثال: *${usedPrefix + command} ما هي عاصمة المغرب؟*`);
  }

  const model = 'grok-3-mini'; // يمكنك تغييره أو جعله قابل للتعديل من args
  const prompt = args.join(' ');

  m.reply('⏳ المرجو الانتظار قليلاً... \nلا تنسى متابعتي على: instagram.com/noureddine_ouafy');

  try {
    const res = await chatai(prompt, { model });
    await m.reply(res.response || '❌ لم يتم العثور على رد');
  } catch (e) {
    m.reply(`⚠️ حدث خطأ: ${e.message}`);
  }
};

handler.help = ['chatai'];
handler.command = ['chatai'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
