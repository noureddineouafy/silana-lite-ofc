// instagram.com/noureddine_ouafy

let handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text)
    return m.reply(
      `Enter the apk name \n\nExample:\n${usedPrefix + command} facebook lite\n\n\n المرجو كتابة الأمر متبوع باسم التطبيق الذي تريد تحميله`,
    );

  conn.apk = conn.apk ? conn.apk : {};

  if (text.split("").length <= 2 && !isNaN(text) && m.sender in conn.apk) {
    text = text.replace(/http:\/\/|https:\/\//i, "");
    let dt = conn.apk[m.sender];
    if (dt.download) return m.reply("You're still downloading!");
    try {
      dt.download = true;
      let data = await aptoide.download(dt.data[text - 1].id);
      let caption = `
Name : ${data.appname}
Developer : ${data.developer}
`.trim();

      await conn.sendMessage(
        m.chat,
        {
          image: { url: data.img },
          caption: caption,
        },
        { quoted: m },
      );

      let dl = await conn.getFile(data.link);
      conn.sendMessage(
        m.chat,
        {
          document: dl.data,
          fileName: data.appname + ".apk",
          mimetype: dl.mime,
        },
        { quoted: m },
      );
    } catch (e) {
      console.error(e);
      m.reply("An error occurred while downloading the APK.");
    } finally {
      dt.download = false;
    }
  } else {
    let data = await aptoide.search(text);

    if (!data || data.length === 0) {
      return m.reply("No results found for your search.");
    }

    let caption = data
      .map((v, i) => {
        return `
${i + 1}. ${v.name}
• Size : ${v.size}
• Version : ${v.version}
• Download : ${v.download}
• Id : ${v.id}
`.trim();
      })
      .join("\n\n");

    let header = `_Please download by typing *${usedPrefix + command} 1*_\n\n\nقم بالإشارة لهذه الرسالة والرد بكتابة الأمر متبوع برقم التطبيق الذي تود تحميله، مثال:\n\n*.apk 1*\n\n`;
    m.reply(header + caption);

    conn.apk[m.sender] = {
      download: false,
      data: data,
      time: setTimeout(() => {
        delete conn.apk[m.sender];
      }, 3600000), // ساعة واحدة
    };
  }
};

handler.help = ["apk"];
handler.tags = ["downloader"];
handler.command = /^(apk)$/i;
handler.limit = true;

export default handler;

const aptoide = {
  search: async function (args) {
    let res = await global.fetch(
      `https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(args)}&limit=1000`,
    );
    res = await res.json();

    if (!res.datalist || !res.datalist.list || res.datalist.list.length === 0) {
      return [];
    }

    return res.datalist.list.map((v) => {
      return {
        name: v.name,
        size: v.size,
        version: v.file?.vername || 'N/A',
        id: v.package,
        download: v.stats?.downloads || 0,
      };
    });
  },

  download: async function (id) {
    let res = await global.fetch(
      `https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(id)}&limit=1`,
    );
    res = await res.json();

    if (!res.datalist || !res.datalist.list || res.datalist.list.length === 0) {
      throw new Error("Application not found.");
    }

    const app = res.datalist.list[0];

    return {
      img: app.icon,
      developer: app.store?.name || 'Unknown',
      appname: app.name,
      link: app.file?.path,
    };
  },
};
