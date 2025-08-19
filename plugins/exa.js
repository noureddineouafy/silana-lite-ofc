// plugin by noureddine ouafy
// scrape by malik

import axios from "axios";

/**
 * A client for interacting with the Exa AI search and chat API.
 */
class ExaAIClient {
    constructor() {
        this.baseURL = "https://exa.ai/search/api";
        this.headers = {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9", // Changed to English for broader compatibility
            "content-type": "application/json",
            "origin": "https://exa.ai",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        };
    }

    /**
     * Makes a POST request to a specific Exa AI API endpoint.
     * @param {string} endpoint - The API endpoint to call (e.g., 'answer', 'search-fast').
     * @param {object} data - The payload for the request.
     * @returns {Promise<object>} The JSON response from the API.
     */
    async makeRequest(endpoint, data) {
        try {
            const url = `${this.baseURL}/${endpoint}`;
            const response = await axios.post(url, data, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error(`[ExaAI Request Error] ${endpoint}:`, error.response?.data || error.message);
            throw new Error(`API request to '${endpoint}' failed.`);
        }
    }

    /**
     * Performs a comprehensive chat and search operation.
     * @param {object} params - The parameters for the operation.
     * @param {string} params.prompt - The user's query.
     * @returns {Promise<object>} An object containing chat, explore, and search results.
     */
    async chat({
        prompt,
        ...rest
    }) {
        try {
            const result = {};
            // Fetch the direct answer
            result.chat = await this.makeRequest("answer", {
                messages: [{
                    role: "user",
                    content: prompt
                }],
                ...rest
            });

            // Fetch standard search results
            result.searchFast = await this.makeRequest("search-fast", {
                numResults: 5, // Limiting to 5 for a concise output
                type: "auto",
                text: false,
                query: prompt,
                useAutoprompt: true,
                ...rest
            });
            return result;
        } catch (error) {
            console.error("[ExaAI Chat Error] Failed to process request:", error.message);
            throw error;
        }
    }
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        throw `Please provide a query to search.\n\n*Example:* ${usedPrefix + command} What are the latest advancements in AI?`;
    }

    try {
        await m.reply("Searching with Exa AI... 🤖");

        const client = new ExaAIClient();
        const response = await client.chat({
            prompt: text
        });

        let output = `*🤖 Exa AI Answer:*\n${response.chat}\n\n`;

        if (response.searchFast && response.searchFast.results?.length > 0) {
            output += "--- \n\n";
            output += "*🔍 Search Results:*\n\n";
            response.searchFast.results.forEach((res, index) => {
                output += `${index + 1}. *${res.title}*\n`;
                output += `   - *URL:* ${res.url}\n\n`;
            });
        } else {
            output += "_No additional search results found._";
        }

        await m.reply(output.trim());

    } catch (error) {
        console.error(error);
        m.reply("An error occurred while fetching the response from Exa AI. Please try again later. 😥");
    }
};

handler.help = ['exa'];
handler.command = ['exa'];
handler.tags = ['search'];
handler.limit = true;

export default handler;
