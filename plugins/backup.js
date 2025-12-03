// instagram.com/noureddine_ouafy

import fs from "fs";
import { execSync } from "child_process";

let handler = async (m, { conn }) => {
  try {
    // Prepare temp directory
    const tempDir = "./tmp";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Clear existing temp files
    const files = fs.readdirSync(tempDir);
    if (files.length > 0) {
      for (let file of files) {
        fs.unlinkSync(`${tempDir}/${file}`);
      }
    }

    await m.reply("*📦 Processing bot script backup...*");

    const backupName = global.botname;
    const backupPath = `${tempDir}/${backupName}.zip`;

    // List files to include in the backup
    const ls = execSync("ls")
      .toString()
      .split("\n")
      .filter(
        (item) =>
          item !== "node_modules" &&
          item !== "sessions" &&
          item !== "package-lock.json" &&
          item !== "yarn.lock" &&
          item !== "pnpm-lock.yaml" &&
          item !== ""
      );

    // Create ZIP backup
    execSync(`zip -r ${backupPath} ${ls.join(" ")}`);

    // Send backup file
    await conn.sendMessage(
      m.sender,
      {
        document: fs.readFileSync(backupPath),
        fileName: `${backupName}.zip`,
        mimetype: "application/zip",
      },
      { quoted: m }
    );

    // Delete temporary backup file
    fs.unlinkSync(backupPath);

    if (m.chat !== m.sender) {
      return m.reply("*Bot script successfully sent to your private chat!*");
    }
  } catch (e) {
    console.error(e);
    m.reply("❌ *Failed to create bot script backup!*");
  }
};

handler.help = ["backup"];
handler.category = ["owner"];
handler.command = ["backup"];
handler.owner = true;

export default handler;
