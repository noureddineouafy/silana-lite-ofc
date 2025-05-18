import axios from "axios";

class Cutout {
  constructor() {
    this.baseUrl = "https://restapi.cutout.pro/web/ai/generateImage";
    this.headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9",
      "content-type": "application/json",
      cookie: "i18n_redirected=en; _gcl_au=1.1.851926648.1735651779; _gid=GA1.2.320960282.1735651780; _gat_gtag_UA_179164044_1=1; _ga=GA1.2.949654489.1735651780; _ga_PFE9YY6MQT=GS1.1.1735651779.1.1.1735651801.38.0.0",
      origin: "https://www.cutout.pro",
      referer: "https://www.cutout.pro/",
      "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    };
  }

  async createJob(prompt, style, quantity = 3, width = 512, height = 512) {
    const url = `${this.baseUrl}/generateAsync?timestamp=${Date.now()}&isCheckSign=true&pn72=VZNRxIXl&sign=6e9107e241b6b2716366641b563d97997c42b0a829a40e3dcac001bdf2c98cdd`;
    const data = {
      prompt,
      style,
      quantity,
      width,
      height
    };
    try {
      const response = await axios.post(url, data, { headers: this.headers });
      const { code, data: { batchId } } = response.data;
      if (code === 0) return batchId;
      throw new Error("فشل في إنشاء المهمة");
    } catch (error) {
      throw error;
    }
  }

  async getImageTaskResult(batchId) {
    const url = `${this.baseUrl}/getGenerateImageTaskResult?batchId=${batchId}&timestamp=${Date.now()}&isCheckSign=true&pnf6=7BLvT7KF&sign=6be6ca6b0ae3c99a67bce8562ed708d8e291543ffd23cf257d03ad0571b6cffd`;
    try {
      const response = await axios.get(url, { headers: this.headers });
      const { code, data } = response.data;
      if (code === 0 && data.text2ImageVoList?.length) {
        const resultWithUrls = data.text2ImageVoList.filter(item => item.resultUrl);
        if (resultWithUrls.length > 0) return resultWithUrls;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async generate(prompt, style = "Realistic Anime", quantity = 3, width = 540, height = 810, timeout = 60000) {
    const batchId = await this.createJob(prompt, style, quantity, width, height);
    const startTime = Date.now();
    let taskData = null;
    while (!taskData && Date.now() - startTime < timeout) {
      taskData = await this.getImageTaskResult(batchId);
      if (taskData?.length) break;
      await new Promise(res => setTimeout(res, 3000));
    }
    if (!taskData) throw new Error("انتهى وقت الانتظار دون الحصول على النتائج");
    return taskData;
  }
}

let handler = async (m, { conn, text, args }) => {
  if (!text) {
    return m.reply(
      `طريقة الاستخدام:\n` +
      `.cutout <الوصف> | [اختياري: النمط] | [اختياري: عدد الصور] | [اختياري: العرض] | [اختياري: الطول]\n\n` +
      `مثال:\n` +
      `.cutout فتاة جميلة في الغابة Realistic Anime 2 512 512`
    );
  }

  try {
    const prompt = text.split("|")[0].trim();
    const style = (text.split("|")[1] || "Realistic Anime").trim();
    const quantity = parseInt((text.split("|")[2] || "3").trim());
    const width = parseInt((text.split("|")[3] || "540").trim());
    const height = parseInt((text.split("|")[4] || "810").trim());

    const cutout = new Cutout();
    const images = await cutout.generate(prompt, style, quantity, width, height);

    // نرسل الصور واحدة تلو الأخرى مباشرة
    for (let i = 0; i < images.length; i++) {
      await conn.sendMessage(m.chat, { image: { url: images[i].resultUrl }, caption: `الصورة ${i + 1} - وصف: ${prompt}` }, { quoted: m });
    }
  } catch (error) {
    m.reply(`حدث خطأ: ${error.message}`);
  }
};

handler.help = ['cutout'];
handler.tags = ['ai'];
handler.command = ['cutout'];
handler.limit = true;
export default handler;
