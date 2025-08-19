// plugin by noureddine ouafy 
// scrape by malik

import axios from "axios";

// The UncoverAPI class encapsulates all the logic for interacting with the service.
class UncoverAPI {
    constructor() {
        this.baseURL = "https://uncovr.app";
        this.backendURL = "https://backend.uncovr.app";
        this.sessionToken = null;
        this.jwtToken = null;
        this.userId = null;
        this.headers = {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        };
    }

    async init() {
        try {
            const authResponse = await axios.post(`${this.baseURL}/api/auth/sign-in/anonymous`, {}, {
                headers: this.headers
            });
            this.sessionToken = authResponse.data.token;
            this.userId = authResponse.data.user.id;

            const tokenResponse = await axios.get(`${this.baseURL}/api/auth/token`, {
                headers: { ...this.headers,
                    Authorization: `Bearer ${this.sessionToken}`
                }
            });
            this.jwtToken = tokenResponse.data.token;
            return true;
        } catch (error) {
            console.error("Initialization failed:", error.response?.data || error.message);
            return false;
        }
    }

    async chat({
        prompt,
        ...options
    }) {
        const initialized = await this.init();
        if (!initialized) {
            throw new Error("Failed to initialize UncoverAPI.");
        }

        if (!this.jwtToken) {
            throw new Error("Not initialized properly. JWT token is missing.");
        }

        const payload = {
            enabledMCPs: {},
            userSettings: {
                allowLocationalSignals: true,
                allowSearchDataCollection: false,
                customisation: {
                    enabled: false,
                    nickname: "",
                    lifeRole: "",
                    ai_traits_prompt: "",
                    extra_instructions: ""
                },
                controlLevel: "normal",
                newChatDefaultModel: "last_used",
                newChatDefaultImageModel: "flux-schnell"
            },
            ai_config: {
                models: {
                    chat: "gemini-2-flash",
                    image_generation: "flux-schnell"
                },
                enabledCoreTools: [],
                temperature: 0.5,
                reasoningEffort: "default",
                globalMode: "chat",
                imageSize: "1:1"
            },
            mode: "normal",
            proposedNewAssistantId: this.generateId(),
            message: {
                id: this.generateId(),
                role: "user",
                parts: [{
                    type: "text",
                    text: prompt
                }]
            },
            ...options
        };

        try {
            const response = await axios.post(`${this.backendURL}/chat`, payload, {
                headers: {
                    ...this.headers,
                    Authorization: `Bearer ${this.jwtToken}`,
                    Origin: this.baseURL,
                    Referer: `${this.baseURL}/`
                },
                responseType: "stream"
            });
            return await this.parseStreamResponse(response.data);
        } catch (error) {
            console.error("Send message failed:", error.response?.data || error.message);
            throw error;
        }
    }

    async parseStreamResponse(stream) {
        return new Promise((resolve, reject) => {
            let fullResponse = "";
            let messageData = {
                stream: {},
                chunks: []
            };

            stream.on("data", chunk => {
                const chunkStr = chunk.toString();
                const lines = chunkStr.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.substring(6));
                            messageData.chunks.push(data);
                            if (data.type) {
                                messageData.stream[data.type] = messageData.stream[data.type] || [];
                                messageData.stream[data.type].push(data);
                            }
                            if (data.type === "text-delta" && data.id === "0") {
                                fullResponse += data.delta;
                            }
                            if (data.type === "finish") {
                                messageData.response = fullResponse;
                                resolve(messageData);
                                stream.destroy(); // End stream processing
                                return;
                            }
                        } catch (parseError) {
                            console.error("Error parsing stream data line:", parseError.message);
                        }
                    }
                }
            });

            stream.on("end", () => {
                if (!messageData.response) {
                    messageData.response = fullResponse;
                }
                resolve(messageData);
            });

            stream.on("error", error => {
                console.error("Stream error occurred:", error);
                reject(error);
            });
        });
    }

    generateId() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// Handler function that uses the UncoverAPI class
let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        throw `Please provide a prompt to Uncover AI.\n\n*Example:* ${usedPrefix + command} what is the theory of relativity?`;
    }

    try {
        await m.reply("Thinking... 🤔");

        const api = new UncoverAPI();
        const response = await api.chat({
            prompt: text
        });

        if (response && response.response) {
            await m.reply(response.response);
        } else {
            throw "Failed to get a valid response from the API.";
        }

    } catch (error) {
        console.error(error);
        m.reply("Sorry, an error occurred while trying to process your request. Please try again later. 😥");
    }
};

// Handler metadata
handler.help = ['uncover'];
handler.command = ['uncover'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
