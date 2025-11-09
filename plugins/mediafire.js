import * as cheerio from "cheerio";
// 'fetch' is globally available in recent Node.js, so no import is needed

const mediaRegex = /https?:\/\/(www\.)?mediafire\.com\/(file|folder)\/(\w+)/;

/**
 * This is the main handler function, matching the example's structure.
 * It uses 'text', 'usedPrefix', and 'command' from the handler arguments.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
	// Translated from Indonesian
	if (!text)
		throw `Example:\n${usedPrefix}${command} https://www.mediafire.com/file/941xczxhn27qbby/GBWA_V12.25FF-By.SamMods-.apk/file`;
	// Translated from Indonesian
	if (!mediaRegex.test(text))
		return m.reply("Invalid link! Make sure it's a correct Mediafire link.");

	try {
        // Translated from Indonesian
		await m.reply("Processing, please wait...");

		let res = await mediafire(text); // Call helper function
		// Translated from Indonesian
		let caption = `
*💌 Name:* ${res.filename}
*📊 Size:* ${res.sizeReadable}
*🗂️ FileType :* ${res.filetype}
*📦 MimeType:* ${res.mimetype}
*🔐 Privacy:* ${res.privacy}
*👤 Owner:* ${res.owner_name}
`.trim();

		await m.reply(caption);
		await conn.sendMessage(
			m.chat,
			{
				document: { url: res.download },
				fileName: res.filename,
				mimetype: res.mimetype,
			},
			{ quoted: m }
		);
	} catch (e) {
		console.error(e);
		// Translated from Indonesian
		m.reply(`Failed to get file from Mediafire. Error: ${e.message}`);
	}
};

// These lines configure the handler, just like the example
handler.help = ["mediafire"];
handler.tags = ["downloader"];
handler.command = /^(mediafire|mf)$/i;
handler.limit = true; // Matches the example
handler.args = true; // This command requires text

// This exports the handler, matching the example
export default handler;

// --- Helper Functions ---
// These live in the same file but outside the handler

async function mediafire(url) {
	const match = mediaRegex.exec(url);
	// Translated from Indonesian
	if (!match) throw new Error("Invalid URL!");

	const id = match[3];

	const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch page failed with status ${response.status}`);
	const html = await response.text();
	const $ = cheerio.load(html);

	const download = $("a#downloadButton").attr("href");
	// Translated from Indonesian
	if (!download) throw new Error("Failed to get download link from Mediafire page.");

	const infoResponse = await fetch(
		`https://www.mediafire.com/api/1.5/file/get_info.php?response_format=json&quick_key=${id}`
	);
    if (!infoResponse.ok) throw new Error(`Fetch API failed with status ${infoResponse.status}`);
	const json = await infoResponse.json();

	// Translated from Indonesian
	if (json.response.result !== "Success") throw new Error("Failed to get file info from API.");
	const info = json.response.file_info;

	const size = parseInt(info.size);
	const ext = info.filename.split(".").pop() || 'bin'; // Add fallback for no extension

	return {
		filename: info.filename,
		ext: ext,
		size: size,
		sizeReadable: formatBytes(size),
		download: download,
		filetype: info.filetype,
		mimetype: info.mimetype || `application/${ext}`,
		privacy: info.privacy,
		owner_name: info.owner_name,
	};
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes"; // Handle zero or invalid input
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
