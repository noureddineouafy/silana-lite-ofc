// noureddine_ouafy
// scrape from channel wha of Tio
/** 
@skrep kelot baju🐦
@elol sendir aja benerin
@wm garena
*/
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';
import fetch from 'node-fetch';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Pixnova {
  constructor() {
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q',
      'dnt': '1',
      'origin': 'https://pixnova.ai',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://pixnova.ai/',
      'fp': '6f4144209c84f0b211fa163f2df3d6ac',
      'fp1': '9ql/F3xu50wofmBCP/OgFcl7LJ6tApNpgApnMs9MmvtrPpOsDolzCCleIXOXI2sS',
      'x-code': '1751088342820',
      'x-guide': 'pHu8//JrvLc1UVdobzPkh3C+5QQjlTO+sNEPGlVAQajV/mYTk3c1NvJh30YPG6S7jb0Dvs2t8oelHE+fYD42jHGVh/2Z7ILqvpW/tr2O1ueJ5erE8JGsCiDWr5QyOqfD9/1aHjYluadqZhBbQQb/Y2YdvJZ2VzPGo5wHbQOzCAc=',
    };
    this.imageBaseUrl = 'https://oss-global.pixnova.ai/';
  }

  async upload(imageInput, fn_name = 'cloth-change') {
    let buffer;
    if (Buffer.isBuffer(imageInput)) {
      buffer = imageInput;
    } else if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
      const res = await fetch(imageInput);
      if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
      buffer = await res.buffer();
    } else if (typeof imageInput === 'string') {
      try {
        buffer = Buffer.from(imageInput, 'base64');
      } catch {
        throw new Error('Invalid base64 image string.');
      }
    } else {
      throw new Error('Invalid image input. Must be Buffer, URL, or base64 string.');
    }

    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) throw new Error('Cannot determine image file type.');

    const blob = new Blob([buffer], { type: fileType.mime });
    const data = new FormData();
    data.append('file', blob, 'image.' + fileType.ext);
    data.append('fn_name', fn_name);
    data.append('request_from', '2');

    const res = await fetch('https://api.pixnova.ai/aitools/upload-img', {
      method: 'POST',
      headers: this.defaultHeaders,
      body: data,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
  }

  async clothCreate(sourceImagePath, prompt) {
    const payload = {
      fn_name: 'cloth-change',
      call_type: 3,
      input: {
        source_image: sourceImagePath,
        prompt,
        request_from: 2,
        type: 1,
      },
      request_from: 2,
    };
    const res = await fetch('https://api.pixnova.ai/aitools/of/create', {
      method: 'POST',
      headers: { ...this.defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create failed: ${await res.text()}`);
    return res.json();
  }

  async checkStatus(taskId) {
    const payload = {
      task_id: taskId,
      fn_name: 'cloth-change',
      call_type: 3,
      request_from: 2,
      origin_from: '111977c0d5def647',
    };
    const res = await fetch('https://api.pixnova.ai/aitools/of/check-status', {
      method: 'POST',
      headers: { ...this.defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Check status failed: ${await res.text()}`);
    return res.json();
  }

  async run(imageInput, prompt) {
    const uploaded = await this.upload(imageInput);
    const imagePath = uploaded.data?.path;
    if (!imagePath) throw new Error('Upload failed or no path returned.');

    const create = await this.clothCreate(imagePath, prompt);
    const taskId = create.data?.task_id;
    if (!taskId) throw new Error('Task creation failed or task_id missing.');

    let retries = 25;
    while (retries-- > 0) {
      const status = await this.checkStatus(taskId);
      const s = status.data?.status;
      if (s === 2) return this.imageBaseUrl + status.data.result_image;
      if (s === -1) throw new Error('Task failed on server.');
      await sleep(7000);
    }
    throw new Error('Timeout: No result after multiple retries.');
  }
}

let handler = async (m, { conn, args }) => {
  const image = m.quoted?.mimetype?.startsWith('image') ? await m.quoted.download() : null;
  const prompt = args.join(' ');
  
  if (!image) return m.reply('❌ المرجو الرد على صورة.');
  if (!prompt) return m.reply('✍️ المرجو إدخال وصف للملابس، مثال:\n.cloth-change red elegant dress');

  try {
    await m.reply('🔄 المرجو الانتظار، يتم معالجة الصورة...');
    const pixnova = new Pixnova();
    const resultUrl = await pixnova.run(image, prompt);
    await conn.sendMessage(m.chat, { image: { url: resultUrl }, caption: `✅ تم بنجاح!\n${resultUrl}` }, { quoted: m });
  } catch (err) {
    console.error(err);
    m.reply(`❌ خطأ:\n${err.message}`);
  }
};

handler.command = ['cloth-change'];
handler.help = ['cloth-change'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
