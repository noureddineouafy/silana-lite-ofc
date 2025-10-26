// instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios";
import crypto from "crypto";

class MusicFull {
  constructor() {
    this.reportUrl = "https://account-api.musicful.ai/v2/report-data";
    this.descUrl = "https://aimusic-api.musicful.ai/musicful/app/v1/async/description-to-song";
    this.lyricsUrl = "https://aimusic-api.musicful.ai/musicful/app/v1/async/lyrics-to-song";
    this.resultUrl = "https://aimusic-api.musicful.ai/musicful/app/v1/song/result";
    this.key = Buffer.from("147258369topmeidia96385topmeidia", "utf8");
    this.iv = Buffer.from("1597531topmeidia", "utf8");
    this.pollInt = 10000;
    this.pollMax = 30;
    this.code = this.genCode();
  }

  genCode() {
    return crypto.randomBytes(8).toString("hex");
  }

  md5(d) {
    return crypto.createHash("md5").update(String(d)).digest("hex").toUpperCase();
  }

  decrypt(txt) {
    try {
      const buf = Buffer.from(txt, "base64");
      const dec = crypto.createDecipheriv("aes-256-cbc", this.key, this.iv);
      return dec.update(buf, null, "utf8") + dec.final("utf8");
    } catch {
      return txt;
    }
  }

  async auth() {
    const ts = Date.now();
    const sign = this.md5(this.code + ts + "member_sign");
    const body = new URLSearchParams({
      software_code: this.code,
      lang: "EN",
      source_site: "google_play",
      information_sources: "200473",
      operating_type: "phone-app",
      operating_system: "android",
      token: "",
      timestamp: ts.toString(),
      sign
    });
    const { data } = await axios.post(this.reportUrl, body);
    if (data.code !== 200) throw new Error(data.msg || "Auth failed");
  }

  async reqDesc(desc) {
    const body = new URLSearchParams({
      description: desc,
      instrumental: "0",
      mv: "v4.0"
    });
    const { data } = await axios.post(this.descUrl, body, {
      headers: { "tourist-authorization": `Bearer ${this.code}` }
    });
    if (data.status !== 200) throw new Error(data.message || "Request failed");
    return data.data?.ids || [];
  }

  async poll(ids) {
    for (let i = 0; i < this.pollMax; i++) {
      const { data } = await axios.get(`${this.resultUrl}?ids=${ids.join(",")}`, {
        headers: { "tourist-authorization": `Bearer ${this.code}` }
      });
      if (data.status !== 200) throw new Error(data.message);
      const songs = data.data?.result || [];
      const done = songs.every(s => s.status === 0 || s.fail_code !== null);
      if (done) return songs;
      await new Promise(r => setTimeout(r, this.pollInt));
    }
    throw new Error("Timeout waiting for results");
  }

  async generate(prompt) {
    await this.auth();
    const ids = await this.reqDesc(prompt);
    const raw = await this.poll(ids);
    return raw
      .filter(s => s.status === 0)
      .map(s => ({
        id: s.id,
        audio: this.decrypt(s.audio_url || ""),
        cover: this.decrypt(s.cover_url || "")
      }));
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎵 Please provide a prompt.\nExample: .musicgen calm piano melody");

  m.reply("⏳ Generating music... please wait.");

  try {
    const music = new MusicFull();
    const results = await music.generate(text);

    if (!results.length) throw new Error("No songs generated.");

    // send only first 2 results
    for (let i = 0; i < Math.min(2, results.length); i++) {
      const song = results[i];
      await conn.sendMessage(m.chat, {
        audio: { url: song.audio },
        mimetype: "audio/mpeg",
        fileName: `music_${i + 1}.mp3`,
        caption: `🎶 *AI Song ${i + 1}*\nPrompt: ${text}`
      });
    }

  } catch (e) {
    console.error(e);
    m.reply(`❌ Error: ${e.message}`);
  }
};

// 🟢 Command name changed here
handler.help = ['musicgen'];
handler.tags = ['ai'];
handler.command = ['musicgen']; 
handler.limit = true;

export default handler;
