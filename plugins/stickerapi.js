import axios from "axios";
import FormData from "form-data";

class StickerAPI {
  constructor({
    baseUrl,
    aiUrl,
    token
  } = {}) {
    this.base = baseUrl || "https://stickercommunity.com/api_v3/";
    this.ai = aiUrl || "https://stickercommunity.com/apps/ai-sticker/api/";
    this.token = token || "Bearer eGPiQb4UpJlEeY5Ewy0NIuDRUBnVpGPlDg2BqgJ2EFkuyFJFRLXGeRvp5kw0b1BbyHxM5ycdNmNT8Y";
    this.ax = axios.create({ timeout: 30000 });
  }

  genId() {
    return `device_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  }

  async getBuff(img) {
    if (Buffer.isBuffer(img)) return img;
    if (typeof img === "string") {
      if (img.startsWith("data:image")) {
        const b64 = img.split(",")[1] || img;
        return Buffer.from(b64, "base64");
      }
      if (!img.startsWith("http")) return Buffer.from(img, "base64");
      const { data } = await this.ax.get(img, { responseType: "arraybuffer" });
      return Buffer.from(data);
    }
    throw new Error("Invalid image format");
  }

  async tags() { return (await this.ax.get(`${this.base}tags_list.php`)).data; }
  async search_list(params) { return (await this.ax.post(`${this.base}ok_best_sticker_search.php`, new URLSearchParams(params))).data; }
  async related(params) { return (await this.ax.post(`${this.base}pack_images_basedPackSingleImg.php`, new URLSearchParams({ pack_image_id: params.id }))).data; }
  async emoji() { return (await this.ax.get(`${this.base}emoji_list.php`)).data; }
  async suggestion() { return (await this.ax.get(`${this.ai}prompt_suggestions_listing.php`)).data; }
  async add_prompt(params) { 
    return (await this.ax.post(`${this.ai}add_prompt_iphone.php`, new URLSearchParams({ device: params.device || "android", country_code: params.country || "US", prompt_name: params.prompt }), { headers: { Authorization: this.token } })).data;
  }
  async prompt_status(params) { 
    return (await this.ax.post(`${this.ai}get_prompt_status.php`, new URLSearchParams({ prompt_id: params.id }), { headers: { Authorization: this.token } })).data;
  }
  async cancel_prompt(params) { 
    return (await this.ax.post(`${this.ai}cancel_process.php`, new URLSearchParams({ prompt_id: params.id }), { headers: { Authorization: this.token } })).data;
  }
  async add_face(params) {
    const devId = params.deviceId || this.genId();
    const buffer = await this.getBuff(params.img);
    const form = new FormData();
    form.append("IMG", buffer, { filename: "image.jpg" });
    form.append("device_id", devId);
    form.append("app_version_id", params.appVer || "1.0");
    form.append("country_id", params.country || "US");
    return (await this.ax.post(`${this.ai}add_face_sticker.php`, form, { headers: form.getHeaders() })).data;
  }
  async face_status(params) { return (await this.ax.post(`${this.ai}get_face_sticker_status.php`, new URLSearchParams({ sticker_id: params.id }))).data; }
  async cancel_face(params) { return (await this.ax.post(`${this.ai}cancel_face_sticker.php`, new URLSearchParams({ sticker_id: params.id }))).data; }
  async report(params) { return (await this.ax.post(`${this.ai}ai_sticker_report.php`, new URLSearchParams({ sticker_id: params.id, sticker_type: params.type || "AI", description: params.desc || "" }))).data; }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply("Send an action. Example: tags, search, related, emoji, add_face, etc.");
  const action = args[0].toLowerCase();
  const params = {};
  if (args[1]) params.search = args.slice(1).join(" ");
  
  const api = new StickerAPI();
  
  try {
    let res;
    switch(action) {
      case "tags": res = await api.tags(); break;
      case "search": res = await api.search_list(params); break;
      case "related": res = await api.related({ id: args[1] }); break;
      case "emoji": res = await api.emoji(); break;
      case "suggestions": res = await api.suggestion(); break;
      case "add_prompt": res = await api.add_prompt({ prompt: args.slice(1).join(" ") }); break;
      case "prompt_status": res = await api.prompt_status({ id: args[1] }); break;
      case "cancel_prompt": res = await api.cancel_prompt({ id: args[1] }); break;
      case "add_face": res = await api.add_face({ img: args[1] }); break;
      case "face_status": res = await api.face_status({ id: args[1] }); break;
      case "cancel_face": res = await api.cancel_face({ id: args[1] }); break;
      case "report": res = await api.report({ id: args[1], type: args[2], desc: args.slice(3).join(" ") }); break;
      default: return m.reply("Action not supported.");
    }
    m.reply(JSON.stringify(res, null, 2));
  } catch(err) {
    m.reply("Error: " + (err.message || err));
  }
};

handler.help = handler.command = ['stickerapi'];
handler.tags = ['sticker'];
handler.limit = true;

export default handler;
