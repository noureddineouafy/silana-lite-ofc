// plugin by noureddine ouafy 
// scraper malik 

import axios from "axios";
import FormData from "form-data";

/**
 * SpeechToText Class
 * Handles the logic for uploading and transcribing audio files.
 */
class SpeechToText {
    constructor() {
        this.api = {
            base: "https://www.speech-to-text.cloud",
            endpoints: {
                upload: "/athanis/upload",
                transcribe: fid => `/athanis/transcribe/${fid}/yyy`
            }
        };
        this.headers = {
            origin: "https://www.speech-to-text.cloud",
            referer: "https://www.speech-to-text.cloud/",
            "user-agent": "NB Android/1.0.0"
        };
    }

    async isBase64Audio(base64) {
        if (!base64 || typeof base64 !== "string") return false;
        const dataUrlPattern = /^data:audio\/[a-zA-Z0-9]+;base64,/;
        if (dataUrlPattern.test(base64)) return true;
        const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
        return base64Pattern.test(base64) && base64.length > 100;
    }

    async base64ToBuffer(base64) {
        try {
            if (base64.startsWith("data:")) {
                const base64Data = base64.split(",")[1];
                return Buffer.from(base64Data, "base64");
            }
            return Buffer.from(base64, "base64");
        } catch (error) {
            throw new Error("Invalid base64 format");
        }
    }

    getFileExtension(contentType) {
        const typeMap = {
            "audio/mpeg": "mp3",
            "audio/mp3": "mp3",
            "audio/wav": "wav",
            "audio/wave": "wav",
            "audio/x-wav": "wav",
            "audio/ogg": "ogg",
            "audio/mp4": "m4a",
            "video/mp4": "mp4",
            "audio/aac": "aac",
            "audio/flac": "flac"
        };
        return typeMap[contentType] || "mp3";
    }

    async upload({
        input,
        filename = null,
        contentType = "audio/mpeg"
    }) {
        try {
            if (!input) {
                return {
                    success: false,
                    code: 400,
                    error: "Audio input is required (base64)"
                };
            }

            let audioBuffer;
            if (await this.isBase64Audio(input)) {
                audioBuffer = await this.base64ToBuffer(input);
                if (!filename) {
                    const extension = this.getFileExtension(contentType);
                    filename = `audio.${extension}`;
                }
            } else {
                return {
                    success: false,
                    code: 400,
                    error: "Invalid input format. Please provide valid base64 audio data"
                };
            }

            const form = new FormData();
            form.append("audio_file", audioBuffer, {
                filename,
                contentType
            });

            const response = await axios.post(`${this.api.base}${this.api.endpoints.upload}`, form, {
                headers: { ...this.headers,
                    ...form.getHeaders()
                },
                timeout: 60000
            });

            const fid = response.data?.fid;
            if (!fid) {
                return {
                    success: false,
                    code: 500,
                    error: "Failed to get file ID from server"
                };
            }
            return {
                success: true,
                data: {
                    fid,
                    filename,
                    contentType
                }
            };
        } catch (error) {
            console.error("Error in upload:", error.message);
            return {
                success: false,
                code: error?.response?.status || 500,
                error: error.message || "Upload failed"
            };
        }
    }

    async transcribe({
        fid
    }) {
        try {
            if (!fid) {
                return {
                    success: false,
                    code: 400,
                    error: "File ID is required"
                };
            }

            const url = `${this.api.base}${this.api.endpoints.transcribe(fid)}`;
            let transcript = "";
            const response = await axios.get(url, {
                headers: { ...this.headers,
                    accept: "*/*"
                },
                responseType: "stream",
                timeout: 0
            });

            await new Promise((resolve, reject) => {
                response.data.on("data", chunk => {
                    const lines = chunk.toString("utf8").split(/\r?\n/);
                    for (const line of lines) {
                        if (line.startsWith("#progress#")) continue;
                        if (line) transcript += line + "\n";
                    }
                });
                response.data.on("end", resolve);
                response.data.on("error", reject);
            });

            return {
                success: true,
                data: {
                    transcript: transcript.trim() || "No speech detected."
                }
            };
        } catch (error) {
            console.error("Error in transcribe:", error.message);
            return {
                success: false,
                code: error?.response?.status || 500,
                error: error.message || "Transcription failed"
            };
        }
    }

    async processAudio({
        input,
        filename = null,
        contentType = "audio/mpeg"
    }) {
        try {
            const uploadResult = await this.upload({
                input,
                filename,
                contentType
            });
            if (!uploadResult.success) return uploadResult;

            const transcribeResult = await this.transcribe({
                fid: uploadResult.data.fid
            });
            if (!transcribeResult.success) return transcribeResult;

            return {
                success: true,
                code: 200,
                data: { ...uploadResult.data,
                    ...transcribeResult.data
                }
            };
        } catch (error) {
            console.error("Error in processAudio:", error.message);
            return {
                success: false,
                code: 500,
                error: error.message || "Audio processing failed"
            };
        }
    }
}

// --- New Handler Implementation ---

let handler = async (m, {
    conn
}) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/audio|video/.test(mime)) {
            return m.reply('❌ Please reply to an audio or video message to transcribe it.');
        }

        await m.reply('⏳ Transcribing audio, please wait...');

        const mediaBuffer = await q.download();
        const mediaBase64 = mediaBuffer.toString('base64');

        const converter = new SpeechToText();
        const response = await converter.processAudio({
            input: mediaBase64,
            contentType: mime
        });

        if (!response.success) {
            return m.reply(`*Error:* ${response.error || 'Failed to transcribe the audio.'}`);
        }

        m.reply(`*Transcription Result:* 🎤\n\n${response.data.transcript}`);

    } catch (e) {
        console.error(e);
        m.reply('An unexpected error occurred. Please try again later.');
    }
};

handler.help = ['transcribe'];
handler.command = ['transcribe'];
handler.tags = ['tools'];
handler.limit = true; // Set to true to enable usage limits if your bot supports it

export default handler;
