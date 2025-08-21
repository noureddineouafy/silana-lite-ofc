/*
 * Base: https://fakeyou.com
 * Author: Shannz
 * Integration & Fix: Gemini 
 * plugin by noureddine ouafy 
 * Note: This script requires 'axios' and 'uuid' to be installed.
 * You can install them with: npm install axios uuid
 */

import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// --- Start of FakeYou API Logic ---

const models = {
  "Angry male": "weight_hehgvegadf08mfp5rzd69dmh4",
  "Rick": "weight_0f762jdzgsy1dhpb86qxy4ssm",
  "Mickey": "weight_sfyjyr67ag1647xs0r7gmvkks",
  "Eric": "weight_h8ebh6fyjyrr1vsjregw6yz8y",
  "Stan": "weight_0cg1294gaf52c7rh0vz7a2ger",
  "Zelda": "weight_b8rncypy7gw6nb0wthnwe2kk4",
};

const fakeyou = {

  generate: async (text, modelName, timeoutMs = 30000) => {
    const job = await fakeyou.create(text, modelName);
    const jobId = job.inference_job_token;
    let result;

    const start = Date.now();
    while (true) {
      result = await fakeyou.status(jobId);
      if (result.status === "complete_success") {
        return result;
      } else if (result.status.startsWith("failed")) {
        throw new Error("TTS generation failed: " + result.status);
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error("Timeout waiting for TTS to complete.");
      }

      // Wait 2 seconds before checking the status again
      await new Promise(r => setTimeout(r, 2000));
    }
  },

  /**
   * Checks the status of a TTS job.
   * @param {string} jobId The job ID token.
   * @returns {Promise<object>} The status object.
   */
  status: async (jobId) => {
    const res = await axios.get(
      `https://api.fakeyou.com/v1/model_inference/job_status/${jobId}`
    );

    const data = res.data.state;
    return {
      jobId: data.job_token,
      status: data.status.status, // <-- CORRECTED LINE
      model: data.maybe_model_title,
      text: data.maybe_raw_inference_text,
      audioUrl: data.maybe_result?.media_links?.cdn_url || null,
    };
  },

  /**
   * Creates a new TTS inference job.
   * @param {string} text The text to convert to speech.
   * @param {string} modelName The name of the voice model to use.
   * @returns {Promise<object>} The job creation response data.
   */
  create: async (text, modelName) => {
    const modelToken = models[modelName];
    if (!modelToken) {
      throw new Error(
        `Model "${modelName}" not found. Available options: ${Object.keys(models).join(", ")}`
      );
    }

    const body = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: text,
    };

    const res = await axios.post(
      "https://api.fakeyou.com/tts/inference",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
      }
    );

    return res.data;
  },
  models,
};

// --- End of FakeYou API Logic ---


// --- Start of Handler Logic ---

let handler = async (m, { conn, args, text }) => {
    const modelKeys = Object.keys(models).join("\n - ");
    
    if (!args[0]) {
        return m.reply(`Please specify a voice model.\n\n*Example:*\n.test Rick Hello everyone!\n\n*Available Models:*\n - ${modelKeys}`);
    }

    const modelName = args[0];
    const speechText = args.slice(1).join(' ');

    if (!models[modelName]) {
        return m.reply(`Invalid model: "${modelName}".\n\n*Available Models:*\n - ${modelKeys}`);
    }

    if (!speechText) {
        return m.reply(`Please provide the text you want to convert to speech.\n\n*Example:*\n.test ${modelName} Hello world`);
    }

    try {
        await m.reply(`🎙️ Generating TTS with ${modelName}'s voice...`);
        
        const result = await fakeyou.generate(speechText, modelName);
        
        if (result && result.audioUrl) {
            // Send the generated audio file to the chat
            await conn.sendFile(m.chat, result.audioUrl, 'tts.mp3', null, m, true, {
                type: 'audio/mp4',
                ptt: true // Send as a voice note
            });
        } else {
            throw new Error("Could not retrieve the audio URL.");
        }

    } catch (e) {
        console.error(e);
        await m.reply(`An error occurred: ${e.message}`);
    }
};

handler.help = ['tts-crazy'];
handler.command = ['tts-crazy'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
