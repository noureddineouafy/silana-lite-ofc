// plugin by noureddine ouafy 
// scrape by malik

import axios from "axios";

class Carbonara {
  constructor() {
    this.api = "https://carbonara.solopov.dev/api/cook";
    this.ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  }

  async generate({ code, lang, ...rest }) {
    if (!code) throw new Error("❌ 'code' parameter cannot be empty.");

    const body = {
      code,
      language: lang || "auto",
      theme: rest.theme || "seti",
      backgroundColor: rest.backgroundColor || "rgba(171, 184, 195, 1)",
      dropShadow: rest.dropShadow ?? true,
      dropShadowBlurRadius: rest.dropShadowBlurRadius || "68px",
      dropShadowOffsetY: rest.dropShadowOffsetY || "20px",
      exportSize: rest.exportSize || "2x",
      fontSize: rest.fontSize || "14px",
      fontFamily: rest.fontFamily || "Hack",
      lineNumbers: rest.lineNumbers ?? false,
      ...rest
    };

    const res = await axios.post(this.api, body, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": this.ua
      },
      responseType: "arraybuffer"
    });

    return {
      buffer: Buffer.from(res.data),
      contentType: res.headers["content-type"]
    };
  }
}

// ====================== MAIN COMMAND HANDLER ======================
let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(
`⚠️ Missing code input.

Example usage:
\`\`\`
.carbon console.log("Hello World");
\`\`\`

Specify language:
\`\`\`
.carbon lang:python print("Hello")
\`\`\`
`
  );

  // Detect language if provided e.g. lang:js
  let lang, code;
  if (text.startsWith("lang:")) {
    const split = text.split(" ");
    lang = split[0].replace("lang:", "").trim();
    code = split.slice(1).join(" ");
  } else {
    code = text;
  }

  try {
    const api = new Carbonara();
    const result = await api.generate({ code, lang });

    await conn.sendFile(
      m.chat,
      result.buffer,
      "carbon.png",
      `✅ Your code snippet image is ready!`,
      m
    );

  } catch (e) {
    m.reply(`❌ Error generating image:\n${e.message}`);
  }
};

handler.help = handler.command = ['carbon'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;


// ====================== GUIDE COMMAND ======================
let guide = async (m) => {
  const GUID = "GUID-CARBON-IMAGE-2025";

  return m.reply(
`📌 *Carbon Code Image Renderer*
**GUID:** ${GUID}

This feature converts your input code into a high-quality highlighted image (similar to Carbon or Ray.so).  
Useful for sharing stylish code snippets on social media, tutorials, or projects.

🛠️ **How to Use**
• Basic:
\`\`\`
.carbon console.log("Hello World")
\`\`\`

• With language:
\`\`\`
.carbon lang:python print("Hello from Python")
\`\`\`

• With multiple lines:
\`\`\`
.carbon
function test(){
  return "OK"
}
\`\`\`

🎨 *Default theme:* Seti  
🌐 *API Source:* carbonara.solopov.dev  

If you encounter issues, check your code formatting and try again.
`
  );
};

guide.help = guide.command = ['carbonguide'];
guide.tags = ['tools'];
guide.limit = false;

export { guide };
