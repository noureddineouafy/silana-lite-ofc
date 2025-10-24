// instagram.com/noureddine_ouafy

import axios from "axios";
import * as cheerio from "cheerio";
import FormData from "form-data";

class XMinus {
  async t() {
    try {
      const r = await axios.get("https://x-minus.pro/ai");
      const $ = cheerio.load(r.data);
      const token = $("input#vocal-cut-auth-key").attr("value");
      const cookie = r.headers["set-cookie"]?.join(";") ?? "";
      return { token, cookie };
    } catch (e) {
      console.error("token err:", e.message);
      return null;
    }
  }

  async c(id, key) {
    const u = "https://x-minus.pro/upload/vocalCutAi?check-job-status";
    const f = new FormData();
    f.append("job_id", id);
    f.append("auth_key", key);
    f.append("locale", "en_US");
    try {
      const r = await axios.post(u, f, { headers: f.getHeaders() });
      return r.data;
    } catch (e) {
      console.error("check err:", e.message);
      return null;
    }
  }

  async p(id, key, i = 5000) {
    return new Promise((res, rej) => {
      const int = setInterval(async () => {
        const d = await this.c(id, key);
        console.log("poll:", d);
        if (d?.status === "done") {
          clearInterval(int);
          res(d);
        } else if (d?.status === "error") {
          clearInterval(int);
          rej(new Error("job fail"));
        }
      }, i);
    });
  }

  async d(id, s) {
    try {
      const u = `https://mmd.uvronline.app/dl/vocalCutAi?job-id=${id}&stem=${s}&fmt=mp3&cdn=0`;
      await axios.get(u, {
        maxRedirects: 0,
        validateStatus: st => st === 302
      });
      console.log(`✅ ${s} ready`);
    } catch (e) {
      console.error(`trigger ${s} err:`, e.message);
    }
  }

  async e(buf) {
    try {
      const { token, cookie } = (await this.t()) ?? {};
      if (!token || !cookie) throw new Error("no token/cookie");

      console.log("upload...", token);
      const f = new FormData();
      f.append("auth_key", token);
      f.append("locale", "en_US");
      f.append("separation", "inst_vocal");
      f.append("separation_type", "vocals_music");
      f.append("format", "mp3");
      f.append("version", "3-4-0");
      f.append("model", "mdx_v2_vocft");
      f.append("aggressiveness", "2");
      f.append("lvpanning", "center");
      f.append("uvrbve_ct", "auto");
      f.append("pre_rate", "100");
      f.append("bve_preproc", "auto");
      f.append("show_setting_format", "0");
      f.append("hostname", "x-minus.pro");
      f.append("client_fp", "-");
      f.append(
        "myfile",
        buf,
        { filename: `a_${Math.random().toString(36).slice(2)}.mp3`, contentType: "audio/mpeg" }
      );

      const r = await axios.post("https://x-minus.pro/upload/vocalCutAi?catch-file", f, {
        headers: { ...f.getHeaders(), accept: "*" }
      });

      console.log("uploaded:", r.data);
      const j = r.data.job_id;
      const s = r.data.similar_job_id;

      await this.p(j, token);
      console.log("trigger dl...");
      await this.d(j, "vocal");
      await this.d(j, "inst");

      const base = `https://${r.data.worker_sd}.uvronline.app/separated/`;
      const id = s || j;

      return {
        vocal: `${base}${id}_Vocals.mp3?fn=${r.data.source_filename}%20(Vocals).mp3`,
        music: `${base}${id}_Instruments.mp3?fn=${r.data.source_filename}%20(Instrumental).mp3`
      };
    } catch (e) {
      console.error("err:", e.response?.data ?? e.message);
      return null;
    }
  }

  async generate({ input }) {
    let buf;
    try {
      if (typeof input === "string") {
        if (input.startsWith("http")) {
          const r = await axios.get(input, { responseType: "arraybuffer" });
          buf = r.data;
        } else if (input.startsWith("data:")) {
          const b64 = input.split(",")[1];
          buf = Buffer.from(b64, "base64");
        } else {
          throw new Error("url/base64 only");
        }
      } else if (Buffer.isBuffer(input)) {
        buf = input;
      } else {
        throw new Error("invalid input");
      }
      return await this.e(buf);
    } catch (e) {
      console.error("gen err:", e.message);
      return null;
    }
  }
}

// ======================= WhatsApp Plugin =======================

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || "";

  if (!text && !/audio|video/.test(mime))
    return m.reply(`🎵 *Usage:*\nReply to an audio/video or send a link\nExample:\n${usedPrefix + command} <audio_url>`);

  m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const api = new XMinus();
    let input;

    if (/audio|video/.test(mime)) {
      input = await q.download();
    } else {
      input = text.trim();
    }

    const result = await api.generate({ input });
    if (!result) return m.reply("❌ فشل في معالجة الصوت.");

    const vocal = await axios.get(result.vocal, { responseType: "arraybuffer" });
    const music = await axios.get(result.music, { responseType: "arraybuffer" });

    await conn.sendMessage(m.chat, {
      audio: Buffer.from(vocal.data),
      mimetype: "audio/mpeg",
      fileName: "vocals.mp3",
      ptt: false,
      caption: "🎤 الصوت المفصول (Vocals)"
    }, { quoted: m });

    await conn.sendMessage(m.chat, {
      audio: Buffer.from(music.data),
      mimetype: "audio/mpeg",
      fileName: "instrumental.mp3",
      ptt: false,
      caption: "🎶 الموسيقى بدون صوت (Instrumental)"
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply("❌ حدث خطأ أثناء فصل الصوت.");
  }
};

handler.help = handler.command = ["vocalremove"];
handler.tags = ["ai"];
handler.limit = true;

export default handler;
