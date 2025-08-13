// instagram.com/noureddine_ouafy
// scrape by malik
import axios from "axios";

class TextWatermarkRemover {
  constructor() {
    this.baseUrl = "https://www.x-design.com/api/v1";
    this.clientId = "1200000018";
    this.appId = "2000010";
    this.countryCode = "ID";
    this.gnum = this.generateGnum();
    this.mtccClient = this.generateMtccClient();
    this.cdnBase = "https://x-design-release.stariicloud.com";
  }
  generateGnum() {
    const t = Date.now().toString(16);
    const r = Math.random().toString(16).substring(2, 15);
    return `${t}-${r}-b457455-412898-${t}${r.substring(0, 5)}`;
  }
  generateMtccClient() {
    const data = {
      app_id: this.appId,
      os_type: "web",
      country_code: this.countryCode,
      gnum: this.gnum,
      function: { name: "00107" },
      position: { level1: "00107" },
      media_type: "photo",
      res_media_type: "photo",
      ext_info: { biz_type: "", virtual_id: "2" },
      uid: ""
    };
    return Buffer.from(JSON.stringify(data)).toString("base64");
  }
  generateRandomId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  async processTextRemoval(imageUrl, automatic = true) {
    const url = `${this.baseUrl}/mtlab/eraser_watermark_v2_async?save_to_own_bucket=ai_eliminate&client_id=${this.clientId}&gid=${this.gnum}&client_language=en&country_code=${this.countryCode}&ts_random_id=${this.generateRandomId()}`;
    const payload = {
      media_info_list: [{
        media_data: imageUrl,
        media_profiles: { media_data_type: "url" }
      }],
      parameter: {
        automatic,
        requester: "design_studio",
        target: "text",
        dilated: true,
        rsp_media_type: "png",
        rgb_mask: true,
        return_translucent: false
      }
    };
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.x-design.com",
        Referer: "https://www.x-design.com/object-remover/edit",
        "x-mtcc-client": this.mtccClient
      }
    });
    return res?.data?.data?.msg_id;
  }
  async queryProcessingStatus(msgId) {
    const url = `${this.baseUrl}/mtlab/query_multi?msg_ids=${msgId}&client_id=${this.clientId}&gid=${this.gnum}&client_language=en&country_code=${this.countryCode}&ts_random_id=${this.generateRandomId()}`;
    const res = await axios.get(url, {
      headers: {
        Origin: "https://www.x-design.com",
        Referer: "https://www.x-design.com/object-remover/edit"
      }
    });
    return res?.data?.data?.[0];
  }
  async waitForCompletion(msgId) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const result = await this.queryProcessingStatus(msgId);
      if (result?.process === 1 && result?.err_code === 0) {
        const path = result?.media_info_list?.[0]?.media_data;
        return path?.startsWith("http") ? path : `${this.cdnBase}${path}`;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Processing timeout");
  }
  async validateImageUrl(imageUrl) {
    const res = await axios.head(imageUrl);
    const type = res?.headers?.["content-type"];
    if (!type?.startsWith("image/")) throw new Error("Invalid image URL");
  }
  async removeTextWatermark({ imageUrl, automatic = true }) {
    await this.validateImageUrl(imageUrl);
    const msgId = await this.processTextRemoval(imageUrl, automatic);
    return await this.waitForCompletion(msgId);
  }
}

let handler = async (m, { conn, text }) => {
  let imageUrl = text?.trim();

  // If user replied to an image, get it
  if (!imageUrl && m.quoted && m.quoted.mimetype?.startsWith("image/")) {
    const media = await m.quoted.download();
    const { default: uploadImage } = await import("../lib/uploadImage.js");
    imageUrl = await uploadImage(media);
  }

  if (!imageUrl) return m.reply("⚠️ Please reply to an image or provide an image URL");

  try {
    await m.reply("⏳ Processing image... Please wait");
    const remover = new TextWatermarkRemover();
    const resultUrl = await remover.removeTextWatermark({ imageUrl });
    await conn.sendFile(m.chat, resultUrl, "result.png", "✅ Watermark removed!", m);
  } catch (e) {
    m.reply("❌ Error: " + e.message);
  }
};

handler.help = handler.command = ["remove-text-watermark"];
handler.tags = ["tools"];
handler.limit = true;
export default handler;
