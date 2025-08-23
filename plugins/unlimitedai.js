import axios from "axios";
import crypto from "crypto";

/**
 * A class to interact with the UnlimitedAI.chat API.
 * It handles token acquisition and chat requests.
 * plugin by noureddine ouafy 
 * scrape by malik
 */
class UnlimitedAIChat {
  constructor() {
    this.apiToken = null;
    this.baseURL = "https://app.unlimitedai.chat/api";
  }

  /**
   * Ensures a valid API token is available before making a request.
   * If no token exists, it fetches a new one.
   */
  async _ensureToken() {
    if (!this.apiToken) {
      try {
        await this.getToken();
      } catch (error) {
        console.error("Failed to get token during initialization:", error);
        throw new Error("Could not retrieve API token.");
      }
    }
  }

  /**
   * Fetches a new session token from the API.
   */
  async getToken() {
    try {
      const response = await axios.get(`${this.baseURL}/token`, {
        headers: {
          "accept": "*/*",
          "accept-language": "id-ID,id;q=0.9",
          "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          "referer": "https://app.unlimitedai.chat/",
        }
      });
      this.apiToken = response.data.token;
      return this.apiToken;
    } catch (error) {
      console.error("Failed to get token:", error);
      throw error;
    }
  }

  /**
   * Sends a chat prompt to the API and gets a response.
   * @param {object} params - The parameters for the chat request.
   * @param {string} params.prompt - The user's input prompt.
   * @param {string} [params.chat_id] - Optional chat ID to continue a conversation.
   * @param {string} [params.model] - The AI model to use.
   */
  async chat({
    prompt,
    chat_id = crypto.randomUUID(),
    model = "chat-model-reasoning"
  }) {
    await this._ensureToken();
    const messagePayload = [{
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      role: "user",
      content: prompt,
      parts: [{
        type: "text",
        text: prompt
      }],
    }, ];

    const payload = {
      id: chat_id,
      messages: messagePayload,
      selectedChatModel: model,
    };

    try {
      const response = await axios.post(`${this.baseURL}/chat`, payload, {
        headers: {
          "accept": "*/*",
          "content-type": "application/json",
          "origin": "https://app.unlimitedai.chat",
          "referer": `https://app.unlimitedai.chat/chat/${chat_id}`,
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          "x-api-token": this.apiToken,
        },
        // Custom response transformer to process the streamed string data
        transformResponse: [data => typeof data === "string" ? this.processString(data) : data],
      });
      return response.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Processes the raw string response from the API into a structured object.
   * @param {string} s - The raw response string.
   * @returns {{result: string, msg_id: string|null, is_continue: boolean}}
   */
  processString(s) {
    try {
      const lines = s.split("\n").filter(line => line.trim() !== "");
      let messageId = null,
        isContinued = false,
        resultText = "";

      lines.forEach(line => {
        if (line.startsWith("f:")) {
          try {
            messageId = JSON.parse(line.substring(2)).messageId;
          } catch {}
        } else if (line.startsWith("e:")) {
          try {
            isContinued = JSON.parse(line.substring(2)).isContinued;
          } catch {}
        } else if (!line.startsWith("d:")) {
          const colonIndex = line.indexOf(":");
          const value = colonIndex > 0 ? line.substring(colonIndex + 1).trim() : line.trim();
          resultText += value.length > 1 ? value.slice(1, -1) : value;
        }
      });

      return {
        result: resultText.replace(/\\\\n/g, "\\n"),
        msg_id: messageId,
        is_continue: isContinued,
      };
    } catch (e) {
      return {
        result: `Error processing response: ${e.message}`,
        msg_id: null,
        is_continue: false,
      };
    }
  }
}


// --- Main Handler ---
const handler = async (m, { conn, text }) => {
  if (!text) throw 'Please provide a prompt. Example: .uai What is the capital of Morocco?';

  try {
    await m.reply('Thinking... 🤔');

    const chatClient = new UnlimitedAIChat();
    const response = await chatClient.chat({ prompt: text });

    if (response && response.result) {
      m.reply(response.result);
    } else {
      throw new Error("Received an empty or invalid response from the API.");
    }
  } catch (error) {
    console.error(error);
    m.reply(`Sorry, an error occurred: ${error.message}`);
  }
};

handler.help = ['unlimitedai'];
handler.command = ['unlimitedai'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
