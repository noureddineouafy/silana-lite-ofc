// plugin by noureddine ouafy 
// scrape by malik

import axios from "axios";

// The ChatGPT class remains the same, handling the API interaction.
class ChatGPT {
  constructor() {
    this.apiUrl = "https://chatgpt-2022.vercel.app/api/chat";
    this.headers = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9",
      "content-type": "application/json",
      origin: "https://chatgpt-2022.vercel.app",
      priority: "u=1, i",
      referer: "https://chatgpt-2022.vercel.app/",
      "sec-ch-ua": '"Lemur";v="135", "", "", "Microsoft Edge Simulate";v="135"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36"
    };
  }

  // The chat method sends the request and processes the streamed response.
  async chat({
    prompt,
    conversation_id = Date.now().toString(),
    model = "both",
    reasoning = "medium",
    messages = [],
    ...rest
  }) {
    return new Promise(async (resolve, reject) => {
      const messageHistory = messages.length ? messages : [{
        role: "user",
        content: prompt
      }];
      const payload = {
        conversationId: conversation_id,
        messages: messageHistory,
        reasoningEffort: reasoning,
        model: model,
        ...rest
      };
      try {
        const response = await axios({
          method: "post",
          url: this.apiUrl,
          headers: this.headers,
          data: payload,
          responseType: "stream"
        });
        const stream = response.data;
        let fullText = "";
        let fullReasoning = "";
        let finalConversationId = conversation_id;
        let isResolved = false;

        stream.on("data", chunk => {
          const chunkStr = chunk.toString();
          const dataLines = chunkStr.split("\n").filter(line => line.startsWith("data: ")).map(line => line.slice(5));
          for (const line of dataLines) {
            if (isResolved || line.trim() === "") continue;
            try {
              const parsedData = JSON.parse(line);
              switch (parsedData.type) {
                case "gpt35-conversation-id":
                case "gpt5-conversation-id":
                  finalConversationId = parsedData.conversationId;
                  break;
                case "text-delta":
                  if (parsedData.textDelta) fullText += parsedData.textDelta;
                  break;
                case "reasoning-delta":
                  if (parsedData.textDelta) fullReasoning += parsedData.textDelta;
                  break;
                case "reasoning-done":
                  if (parsedData.text) fullReasoning = parsedData.text;
                  break;
                case "completion":
                  isResolved = true;
                  stream.destroy();
                  resolve({
                    text: fullText,
                    reasoning: fullReasoning,
                    conversation_id: finalConversationId
                  });
                  return;
              }
            } catch (error) {
                // Ignore parsing errors for incomplete JSON chunks
            }
          }
        });

        stream.on("end", () => {
          if (!isResolved) {
            isResolved = true;
            resolve({
              text: fullText,
              reasoning: fullReasoning,
              conversation_id: finalConversationId
            });
          }
        });

        stream.on("error", error => {
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}


// This is the main handler that integrates your ChatGPT class.
let handler = async (m, { conn, text }) => {
    // Check if the user provided a prompt
    if (!text) throw 'Please provide a prompt. Example: .chatgpt What is a black hole?';

    try {
        // Show a waiting message
        await m.reply('Please wait, processing your request...');

        // Instantiate the client and call the chat function
        const client = new ChatGPT();
        const response = await client.chat({ prompt: text });

        // Reply to the user with the text from the API response
        if (response && response.text) {
            await m.reply(response.text);
        } else {
            throw 'Failed to get a valid response.';
        }

    } catch (e) {
        // Log the error and inform the user
        console.error(e);
        await m.reply('Sorry, an error occurred while processing your request.');
    }
};

// Handler configuration
handler.help = ['chatgpt2022'];
handler.command = ['chatgpt2022']; // Using more descriptive command names
handler.tags = ['ai'];
handler.limit = true; // Apply limits if you have a limit system

export default handler;
