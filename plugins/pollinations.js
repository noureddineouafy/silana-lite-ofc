/**
 * Generator Image - Gen Ai
 * plugin by noureddine ouafy
 * scrape by gienetic
 * Base    : https://play.google.com/store/apps/details?id=com.sparksolutionz.genai
 */

import axios from "axios";
import fs from "fs";
import path from "path";

let handler = async (m, { conn, text }) => {
    if (!text) return conn.sendMessage(m.chat, { text: "❌ المرجو كتابة وصف للصورة." }, { quoted: m });

    async function generatePollinations(prompt, model = "flux", opts = {}) {
        const {
            width = 960,
            height = 1280,
            seed = Math.floor(Math.random() * 999999),
            nologo = true,
            enhance = true,
            hidewatermark = true,
        } = opts;

        try {
            const query = new URLSearchParams({
                model,
                width,
                height,
                seed,
            });

            if (nologo) query.set("nologo", "true");
            if (enhance) query.set("enhance", "true");
            if (hidewatermark) query.set("hidewatermark", "true");

            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query.toString()}`;

            const res = await axios.get(url, {
                responseType: "arraybuffer",
            });

            return Buffer.from(res.data, "binary");
        } catch (err) {
            console.error("❌ فشل في توليد الصورة:", err.message);
            throw new Error("فشل في توليد الصورة من Pollinations");
        }
    }

    try {
        const buffer = await generatePollinations(text, "flux");

        // حفظ الصورة مؤقتًا قبل الإرسال
        const tempFile = path.join('./', `pollinations_${Date.now()}.png`);
        fs.writeFileSync(tempFile, buffer);

        await conn.sendMessage(m.chat, {
            image: fs.readFileSync(tempFile),
            caption: `✨ ها هي الصورة بناءً على الوصف: "${text}"`
        }, { quoted: m });

        // حذف الملف المؤقت
        fs.unlinkSync(tempFile);
    } catch (err) {
        await conn.sendMessage(m.chat, { text: "❌ حدث خطأ: " + err.message }, { quoted: m });
    }
};

handler.help = handler.command = ['pollinations'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
