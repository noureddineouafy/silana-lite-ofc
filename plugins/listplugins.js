// instagram.com/noureddine_ouafy
import fs from "fs";

let handler = async (m, { conn }) => {
  let dir = fs.readdirSync("./plugins");
  if (dir.length < 1) return m.reply("No plugin files found.");

  let teks = "\n";
  for (let e of dir) {
    teks += `* ${e}\n`;
  }
  m.reply(teks);
};

handler.command = ["listplugins"];
handler.help = ["listplugins"];
handler.tags= ["infobot"];
export default handler;
