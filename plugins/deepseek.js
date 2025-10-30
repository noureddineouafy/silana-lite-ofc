// plugin by noureddine ouafy
// scrape by malik

import axios from "axios";
class DeepseekChat {
  async chat({
    model = "deepseek-chat",
    prompt = "",
    messages = [],
    stream = false,
    ...rest
  }) {
    const requestId = Date.now();
    const startTime = Date.now();
    console.log(`[${requestId}] Chat request started`, {
      model: model,
      prompt: !!prompt,
      messagesCount: messages.length,
      stream: stream
    });
    const msg = messages.length ? messages : [{
      role: "user",
      content: prompt || "hi"
    }];
    const body = {
      model: model,
      messages: msg,
      temperature: rest?.temp ?? .7,
      stream: stream,
      ...rest
    };
    console.log(`[${requestId}] Sending request:`, body);
    try {
      const response = await axios.post("https://api.deepseek.com/v1/chat/completions", body, {
        headers: {
          Authorization: this.decode("QmVhcmVyIHNrLTI1YTA1NWYzMWI1ZTRlMGQ5ZjBlYjVkOWZjYWM2NGZj"),
          "Content-Type": "application/json"
        },
        responseType: stream ? "stream" : "json"
      });
      console.log(`[${requestId}] Response ${response.status}`);
      let result = "";
      let finishReason = null;
      let usage = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };
      if (stream) {
        const streamData = response.data;
        let buffer = "";
        for await (const chunk of streamData) {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          for (const line of lines.slice(0, -1)) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith("data: ")) {
              const data = trimmed.substring(6).trim();
              if (data === "[DONE]") {
                console.log(`[${requestId}] Stream [DONE]`);
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta;
                if (delta?.content) result += delta.content;
                if (parsed?.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
                if (parsed?.usage) usage = parsed.usage;
              } catch (e) {
                console.warn(`[${requestId}] JSON parse error:`, data, e);
              }
            }
          }
          buffer = lines[lines.length - 1] || "";
        }
        if (!finishReason) finishReason = "stop";
        console.log(`[${requestId}] Stream ended`);
      } else {
        const data = response.data;
        result = data?.choices?.[0]?.message?.content || "";
        finishReason = data?.choices?.[0]?.finish_reason || null;
        if (data?.usage) usage = data.usage;
        console.log(`[${requestId}] Non-stream response parsed`);
      }
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Completed in ${duration}ms`, {
        resultLength: result.length,
        finishReason: finishReason,
        usage: usage
      });
      return {
        result: result,
        model: model,
        finish_reason: finishReason,
        usage: usage,
        duration_ms: duration,
        request_id: requestId,
        streamed: stream
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error.response) {
        console.error(`[${requestId}] HTTP ${error.response.status}`, {
          statusText: error.response.statusText,
          data: error.response.data?.toString?.().substring(0, 500)
        });
      } else if (error.request) {
        console.error(`[${requestId}] No response`, error.message);
      } else {
        console.error(`[${requestId}] Setup error`, error.message);
      }
      throw {
        error: true,
        message: error.message,
        code: error.code || "UNKNOWN",
        duration_ms: duration,
        request_id: requestId,
        streamed: stream
      };
    }
  }
  decode(str) {
    try {
      return JSON.parse(Buffer.from(str, "base64").toString());
    } catch {
      return Buffer.from(str, "base64").toString();
    }
  }
}

// --- New Bot Handler ---

let handler = async (m, { conn }) => {
  // m.text is assumed to contain the prompt text after the command
  let prompt = m.text;

  if (!prompt) {
    return m.reply('Please provide a prompt.\n\n*Example:*\n.deepseek Who are you?');
  }

  try {
    // Notify the user that the request is in progress
    await m.reply('🧠 Thinking, please wait...');

    const api = new DeepseekChat();
    
    // Call the chat method. 'stream: false' is used for a single bot reply.
    const response = await api.chat({
      prompt: prompt,
      stream: false 
    });

    // Send the final result
    await m.reply(response.result);

  } catch (error) {
    // Log the error for debugging
    console.error('Deepseek Handler Error:', error);
    
    // Inform the user of the error
    await m.reply(`Sorry, an error occurred: ${error.message || 'Unknown error'}`);
  }
}

// Set handler metadata
handler.help = handler.command = ['deepseek']; 
handler.tags = ['ai']; 
handler.limit = true; 

export default handler;
