// @instagram.com/noureddine_ouafy
// Plugin: Illaria Upscaler
// scrape by Rynn Hub
import axios from 'axios';
import FormData from 'form-data';

class IllariaUpscaler {
  constructor() {
    this.api_url = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api';
    this.file_url = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api/file=';
  }

  generateSession = () => Math.random().toString(36).substring(2);

  upload = async (buffer) => {
    const upload_id = this.generateSession();
    const orig_name = `rynn_${Date.now()}.jpg`;
    const form = new FormData();
    form.append('files', buffer, orig_name);
    const { data } = await axios.post(`${this.api_url}/upload?upload_id=${upload_id}`, form, {
      headers: form.getHeaders(),
    });
    return {
      orig_name,
      path: data[0],
      url: `${this.file_url}${data[0]}`,
    };
  };

  process = async (buffer, options = {}) => {
    const {
      model = 'RealESRGAN_x4plus',
      denoice_strength = 0.5,
      resolution = 4,
      fase_enhancement = false,
    } = options;

    const _model = [
      'RealESRGAN_x4plus',
      'RealESRNet_x4plus',
      'RealESRGAN_x4plus_anime_6B',
      'RealESRGAN_x2plus',
      'realesr-general-x4v3',
    ];

    if (!Buffer.isBuffer(buffer)) throw new Error('❌ Image buffer is required');
    if (!_model.includes(model)) throw new Error(`❌ Available models: ${_model.join(', ')}`);
    if (denoice_strength > 1) throw new Error('❌ Max denoice strength: 1');
    if (resolution > 6) throw new Error('❌ Max resolution: 6');
    if (typeof fase_enhancement !== 'boolean') throw new Error('❌ fase_enhancement must be boolean');

    const image_url = await this.upload(buffer);
    const session_hash = this.generateSession();

    await axios.post(`${this.api_url}/queue/join?`, {
      data: [
        {
          path: image_url.path,
          url: image_url.url,
          orig_name: image_url.orig_name,
          size: buffer.length,
          mime_type: 'image/jpeg',
          meta: {
            _type: 'gradio.FileData',
          },
        },
        model,
        denoice_strength,
        fase_enhancement,
        resolution,
      ],
      event_data: null,
      fn_index: 1,
      trigger_id: 20,
      session_hash,
    });

    const { data } = await axios.get(`${this.api_url}/queue/data?session_hash=${session_hash}`);
    const lines = data.split('\n\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const d = JSON.parse(line.substring(6));
        if (d.msg === 'process_completed') return d.output.data[0].url;
      }
    }

    throw new Error('❌ Failed to get upscaled image');
  };
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.quoted || !/image/.test(m.quoted.mimetype || '')) {
    return m.reply(`📸 من فضلك قم بالرد على صورة لاستخدام الأمر: \n\n*.${command}*`);
  }

  const qimg = await m.quoted.download();

  m.reply("🔄 المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const upscaler = new IllariaUpscaler();
    const result = await upscaler.process(qimg, {
      fase_enhancement: true,
      resolution: 4,
    });

    if (!result) return m.reply('❌ لم يتم الحصول على رابط الصورة الناتجة.');

    await conn.sendFile(m.chat, result, 'upscaled.jpg', '✅ تم تحسين الصورة بنجاح', m);
  } catch (e) {
    console.error(e);
    m.reply(`⚠️ فشل في معالجة الصورة:\n\n${e.message}`);
  }
};

handler.help = ['ilaria-upscaler'];
handler.tags = ['tools'];
handler.command = ['ilaria-upscaler'];
handler.limit = true;

export default handler;
