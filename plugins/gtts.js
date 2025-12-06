// plugin by noureddine ouafy 
// scrape by malik


import axios from "axios";

// ==========================================
// 1. DATA & LOGIC
// ==========================================

const VOICES = [{
  name: "Arabic",
  lang: "ar"
}, { // <--- VOICE [0]: Arabic is now the default
  name: "Indonesia Indonesia",
  lang: "id_ID"
}, {
  name: "Assam India",
  lang: "as_IN"
}, {
  name: "Bulgaria Bulgaria",
  lang: "bg_BG"
}, {
  name: "Bengali Bangladesh",
  lang: "bn_BD"
}, {
  name: "Bengali India",
  lang: "bn_IN"
}, {
  name: "Bodo India",
  lang: "brx_IN"
}, {
  name: "Bosnia Bosnia dan Herzegovina",
  lang: "bs_BA_#Cyrl"
}, {
  name: "Bosnia Bosnia dan Herzegovina",
  lang: "bs_BA_#Latn"
}, {
  name: "Katalan Spanyol",
  lang: "ca_ES"
}, {
  name: "Cheska Ceko",
  lang: "cs_CZ"
}, {
  name: "Welsh Inggris Raya",
  lang: "cy_GB"
}, {
  name: "Dansk Denmark",
  lang: "da_DK"
}, {
  name: "Jerman Jerman",
  lang: "de_DE"
}, {
  name: "Dogri India",
  lang: "doi_IN"
}, {
  name: "Yunani Yunani",
  lang: "el_GR"
}, {
  name: "Inggris Australia",
  lang: "en_AU"
}, {
  name: "Inggris Inggris Raya",
  lang: "en_GB"
}, {
  name: "Inggris India",
  lang: "en_IN"
}, {
  name: "Inggris Nigeria",
  lang: "en_NG"
}, {
  name: "Inggris Amerika Serikat",
  lang: "en_US"
}, {
  name: "Spanyol Spanyol",
  lang: "es_ES"
}, {
  name: "Spanyol Amerika Serikat",
  lang: "es_US"
}, {
  name: "Esti Estonia",
  lang: "et_EE"
}, {
  name: "Suomi Finlandia",
  lang: "fi_FI"
}, {
  name: "Filipino Filipina",
  lang: "fil_PH"
}, {
  name: "Prancis Kanada",
  lang: "fr_CA"
}, {
  name: "Prancis Prancis",
  lang: "fr_FR"
}, {
  name: "Gujarat India",
  lang: "gu_IN"
}, {
  name: "Ibrani Israel",
  lang: "he_IL"
}, {
  name: "Hindi India",
  lang: "hi_IN"
}, {
  name: "Hindi India",
  lang: "hi_IN_#Latn"
}, {
  name: "Kroasia Kroasia",
  lang: "hr_HR"
}, {
  name: "Hungaria Hungaria",
  lang: "hu_HU"
}, {
  name: "Islandia Islandia",
  lang: "is_IS"
}, {
  name: "Italia Italia",
  lang: "it_IT"
}, {
  name: "Jepang Jepang",
  lang: "ja_JP"
}, {
  name: "Jawa Indonesia",
  lang: "jv_ID"
}, {
  name: "Khmer Kamboja",
  lang: "km_KH"
}, {
  name: "Kannada India",
  lang: "kn_IN"
}, {
  name: "Korea Korea Selatan",
  lang: "ko_KR"
}, {
  name: "Konkani India",
  lang: "kok_IN"
}, {
  name: "Kashmir India",
  lang: "ks_IN_#Arab"
}, {
  name: "Kashmir India",
  lang: "ks_IN_#Deva"
}, {
  name: "Lituavi Lituania",
  lang: "lt_LT"
}, {
  name: "Latvi Latvia",
  lang: "lv_LV"
}, {
  name: "Maithili India",
  lang: "mai_IN"
}, {
  name: "Malayalam India",
  lang: "ml_IN"
}, {
  name: "Manipuri India",
  lang: "mni_IN_#Beng"
}, {
  name: "Marathi India",
  lang: "mr_IN"
}, {
  name: "Melayu Malaysia",
  lang: "ms_MY"
}, {
  name: "Bokmål Norwegia Norwegia",
  lang: "nb_NO"
}, {
  name: "Nepali Nepal",
  lang: "ne_NP"
}, {
  name: "Belanda Belgia",
  lang: "nl_BE"
}, {
  name: "Belanda Belanda",
  lang: "nl_NL"
}, {
  name: "Oriya India",
  lang: "or_IN"
}, {
  name: "Punjabi India",
  lang: "pa_IN_#Guru"
}, {
  name: "Polski Polandia",
  lang: "pl_PL"
}, {
  name: "Portugis Brasil",
  lang: "pt_BR"
}, {
  name: "Portugis Portugal",
  lang: "pt_PT"
}, {
  name: "Rumania Rumania",
  lang: "ro_RO"
}, {
  name: "Rusia روسيا",
  lang: "ru_RU"
}, {
  name: "Sanskerta India",
  lang: "sa_IN"
}, {
  name: "Santali India",
  lang: "sat_IN_#Olck"
}, {
  name: "Sindhi India",
  lang: "sd_IN_#Deva"
}, {
  name: "Sinhala Sri Lanka",
  lang: "si_LK"
}, {
  name: "Slovak Slovakia",
  lang: "sk_SK"
}, {
  name: "Sloven Slovenia",
  lang: "sl_SI"
}, {
  name: "Albania Albania",
  lang: "sq_AL"
}, {
  name: "Serbia Serbia",
  lang: "sr_RS_#Cyrl"
}, {
  name: "Serbia Serbia",
  lang: "sr_RS_#Latn"
}, {
  name: "Sunda Indonesia",
  lang: "su_ID_#Latn"
}, {
  name: "Swedia Swedia",
  lang: "sv_SE"
}, {
  name: "Swahili Kenya",
  lang: "sw_KE"
}, {
  name: "Tamil India",
  lang: "ta_IN"
}, {
  name: "Telugu India",
  lang: "te_IN"
}, {
  name: "Thai Thailand",
  lang: "th_TH"
}, {
  name: "Turki Turki",
  lang: "tr_TR"
}, {
  name: "Ukraina Ukraina",
  lang: "uk_UA"
}, {
  name: "Urdu India",
  lang: "ur_IN"
}, {
  name: "Urdu Pakistan",
  lang: "ur_PK"
}, {
  name: "Vietnam Vietnam",
  lang: "vi_VN"
}, {
  name: "Kanton Hong Kong",
  lang: "yue_HK_#Hant"
}, {
  name: "Tionghoa Tiongkok",
  lang: "zh_CN_#Hans"
}, {
  name: "Tionghoa Hong Kong",
  lang: "zh_HK_#Hans"
}, {
  name: "Tionghoa Makau",
  lang: "zh_MO_#Hans"
}, {
  name: "Tionghoa Singapura",
  lang: "zh_SG_#Hans"
}, {
  name: "Tionghoa Hong Kong",
  lang: "zh_HK_#Hant"
}, {
  name: "Tionghoa Makau",
  lang: "zh_MO_#Hant"
}, {
  name: "Tionghoa Taiwan",
  lang: "zh_TW_#Hant"
}];

class VoiceGen {
  constructor() {
    this.baseUrl = "https://www.google.com/speech-api/v2/synthesize";
    this.key = "AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw";
    this.client = "chromium";
  }

  getV(val) {
    const index = parseInt(val);
    if (Number.isInteger(index) && VOICES[index]) {
      return VOICES[index];
    }
    return VOICES.find(v => v.name === val || v.name.toLowerCase() === val?.toLowerCase() || v.lang === val);
  }

  validate(val) {
    const found = this.getV(val);
    const selected = found || VOICES[0]; // **Arabic is now the default voice here**
    return selected;
  }

  async generate({
    text,
    voice,
    ...rest
  }) {
    try {
      const txt = text?.trim() || "No text provided";
      const selVoice = this.validate(voice);
      const spdInput = Number(rest?.speed || 1);
      const ptcInput = Number(rest?.pitch || 1);
      
      const calcSpeed = spdInput <= 1 ? spdInput / 2 : .5 + (spdInput - 1) / 4 * .5;
      const calcPitch = Math.min(ptcInput / 2, 1);
      
      const vNameLower = selVoice.name.toLowerCase();
      let nameParam = "";
      if (vNameLower.includes("female")) {
        nameParam = "fis";
      } else if (vNameLower.includes("male")) {
        nameParam = "rjs";
      }

      const params = {
        key: this.key,
        text: txt,
        lang: selVoice.lang,
        enc: "mpeg",
        client: this.client,
        speed: calcSpeed.toString(),
        pitch: calcPitch.toString(),
        ...nameParam && {
          name: nameParam
        }
      };

      const res = await axios.get(this.baseUrl, {
        params: params,
        responseType: "arraybuffer"
      });
      return Buffer.from(res.data);
    } catch (err) {
      throw new Error(err?.response?.data ? Buffer.from(err.response.data).toString() : err.message);
    }
  }
}

// ... بقية ال Handler ... (The rest of the Handler remains the same)

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Help message if no text is provided
    if (!text) {
        return m.reply(
            `*Google TTS (Text-to-Speech)*\n\n` +
            `Usage: *${usedPrefix + command} text | language_code | speed | pitch*\n` +
            `Example (Arabic Default): *${usedPrefix + command} مرحبا بكم*\n\n` +
            `To see all available languages, type: *${usedPrefix + command} list*`
        );
    }

    // 2. Handle "List" command
    if (text.toLowerCase() === 'list') {
        let list = "*AVAILABLE LANGUAGES:*\n\n";
        VOICES.forEach((v, i) => {
            list += `[${i}] ${v.name} (${v.lang})\n`;
        });
        return m.reply(list);
    }

    m.react('🎧');

    try {
        // 3. Parse arguments: Text | Voice | Speed | Pitch
        const args = text.split('|');
        const textInput = args[0];
        // Note: voiceInput will now default to 'ar' if not specified because VOICES[0] is 'ar'
        const voiceInput = args[1] ? args[1].trim() : 'ar'; 
        const speedInput = args[2] ? args[2].trim() : 1;
        const pitchInput = args[3] ? args[3].trim() : 1;

        const api = new VoiceGen();
        
        // 4. Generate Audio
        const buffer = await api.generate({
            text: textInput,
            voice: voiceInput,
            speed: speedInput,
            pitch: pitchInput
        });

        if (!buffer) throw new Error("Empty audio buffer received.");

        // 5. Send as PTT (Voice Note)
        await conn.sendMessage(m.chat, { 
            audio: buffer, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ['gtts'];
handler.tags = ['ai'];
handler.command = /^(gtts)$/i;
handler.limit = true;

export default handler;
