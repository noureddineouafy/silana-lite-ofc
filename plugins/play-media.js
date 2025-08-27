// SOURCE SCRAPER: https://whatsapp.com/channel/0029Vb5EZCjIiRotHCI1213L/436
// plugin by https://codeshare.cloudku.click/view?id=9c1346f2
// translate and edited again by noureddine ouafy

const WAIT_REACTION = "⏳";
const SUCCESS_REACTION = "✅";
const ERROR_REACTION = "❌";

function formatDuration(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return 'N/A';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(remainingSeconds).padStart(2, '0'));

    return parts.join(':');
}

function parseDurationToSeconds(durationInput) {
    if (typeof durationInput === 'number') {
        return durationInput;
    }
    if (typeof durationInput !== 'string') {
        return null;
    }
    const parts = durationInput.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

const yt = {
    get baseUrl() {
        return {
            origin: 'https://ssvid.net'
        }
    },

    get baseHeaders() {
        return {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': this.baseUrl.origin,
            'referer': this.baseUrl.origin + '/youtube'
        }
    },

    validateFormat: function (userFormat) {
        const validDownloadFormats = ['mp3', '360p', '720p', '1080p'];
        if (!validDownloadFormats.includes(userFormat)) {
            throw new Error(`Invalid internal download format: ${userFormat}`);
        }
    },

    handleFormat: function (userFormat, searchJson) {
        this.validateFormat(userFormat);
        let resultLinkKey;

        if (userFormat === 'mp3') {
            resultLinkKey = searchJson.links?.mp3?.mp3128?.k;
        } else {
            let selectedFormat;
            const allMp4Formats = Object.values(searchJson.links.mp4 || {});
            
            const availableQualities = allMp4Formats
                                       .filter(v => /\d+p/.test(v.q))
                                       .map(v => parseInt(v.q))
                                       .sort((a, b) => b - a);
            
            const availableQualitiesStr = availableQualities.map(q => `${q}p`);

            if (!availableQualitiesStr.includes(userFormat)) {
                selectedFormat = availableQualitiesStr[0];
                console.log(`[YTDownloader] Format ${userFormat} not available. Automatically falling back to best available quality: ${selectedFormat}`);
            } else {
                selectedFormat = userFormat;
            }
            
            const findFormatEntry = allMp4Formats.find(v => v.q === selectedFormat);
            resultLinkKey = findFormatEntry?.k;
        }
        if (!resultLinkKey) {
            throw new Error(`Download link for format ${userFormat} not found. Try another format.`);
        }
        return resultLinkKey;
    },

    hit: async function (path, payload) {
        const body = new URLSearchParams(payload);
        const opts = { headers: this.baseHeaders, body, method: 'POST', timeout: 30000 };
        try {
            const r = await fetch(`${this.baseUrl.origin}${path}`, opts);
            console.log(`[YTDownloader] Hit path: ${path}`);
            if (!r.ok) {
                const errorText = await r.text();
                throw new Error(`${r.status} ${r.statusText}\n${errorText}`);
            }
            const j = await r.json();
            return j;
        } catch (e) {
            throw new Error(`[YTDownloader] Request to ${path} failed: ${e.message}`);
        }
    },

    download: async function (queryOrYtUrl, userFormat = 'mp3') {
        this.validateFormat(userFormat);
        
        let initialSearchResult;
        let videoMetadata = {};

        try {
            initialSearchResult = await this.hit('/api/ajax/search', {
                "query": queryOrYtUrl,
                "cf_token": "",
                "vt": "youtube"
            });
        } catch (error) {
            if (queryOrYtUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)) {
                console.log("[YTDownloader] Initial search/parse failed, trying direct URL conversion endpoint.");
                try {
                    initialSearchResult = await this.hit('/api/ajax/convert', {
                        "query": queryOrYtUrl,
                        "cf_token": "",
                        "vt": "youtube"
                    });
                } catch (e) {
                    throw new Error(`[YTDownloader] Failed to search or analyze YouTube URL: ${e.message}`);
                }
            } else {
                 throw new Error(`[YTDownloader] Failed to search YouTube: ${error.message}`);
            }
        }

        let finalDetailsResult = initialSearchResult;

        if (initialSearchResult.p === 'search') {
            if (!initialSearchResult?.items?.length) {
                throw new Error(`No search results for "${queryOrYtUrl}".`);
            }
            const firstItem = initialSearchResult.items[0];
            const { v, t, a, l } = firstItem;

            videoMetadata.title = t;
            videoMetadata.author = a;
            videoMetadata.duration = parseDurationToSeconds(l);

            const videoUrl = 'https://www.youtube.com/watch?v=' + v;
            console.log(`[YTDownloader] Found: ${t} (${videoUrl})`);

            finalDetailsResult = await this.hit('/api/ajax/search', {
                "query": videoUrl,
                "cf_token": "",
                "vt": "youtube"
            });
        }

        videoMetadata.title = finalDetailsResult.title || videoMetadata.title;
        videoMetadata.author = finalDetailsResult.author || finalDetailsResult.uploader_name || videoMetadata.author;
        videoMetadata.duration = parseDurationToSeconds(finalDetailsResult.duration || finalDetailsResult.length_seconds) || videoMetadata.duration;
        videoMetadata.thumb = finalDetailsResult.thumb || finalDetailsResult.thumbnail || videoMetadata.thumb;
        
        const vid = finalDetailsResult.vid;
        if (!vid) {
            throw new Error("Video ID not found from search/analysis result.");
        }
        
        const k = this.handleFormat(userFormat, finalDetailsResult);

        const convertResult = await this.hit('/api/ajax/convert', {
            k, vid
        });
        
        if (convertResult.status !== 'ok' || convertResult.c_status !== 'CONVERTED' || !convertResult.dlink) {
            throw new Error(`Failed to convert video. Status: ${convertResult.c_status || 'UNKNOWN'}. Message: ${convertResult.mess || 'No message.'}`);
        }

        return {
            ...convertResult,
            title: convertResult.title || videoMetadata.title,
            author: videoMetadata.author,
            duration: videoMetadata.duration,
            thumb: videoMetadata.thumb,
            vid: vid 
        };
    },
};


const handler = async (m, { conn, text, usedPrefix, command }) => {
  const audioTypeKeyword = 'mp3';
  const genericVideoKeyword = 'mp4';
  const specificVideoQualities = ['360p', '720p', '1080p'];
  
  const helpMessage = `*Invalid format!* Please provide a YouTube URL or search query, followed by the desired format.

*Audio Type:* ${audioTypeKeyword}
*Generic Video Type:* ${genericVideoKeyword}
*Specific Video Qualities:* ${specificVideoQualities.join(', ')}

*Example:*\n*${usedPrefix}play-media https://youtu.be/dQw4w9WgXcQ ${genericVideoKeyword}*\n*${usedPrefix}play-media latest pop song ${audioTypeKeyword}*\n*${usedPrefix}play-media funny video 720p*`;

  if (!text) {
    return m.reply(helpMessage);
  }

  const args = text.split(' ');
  if (args.length < 2) {
    return m.reply(helpMessage);
  }

  let userRequestedTypeOrQuality = args[args.length - 1].toLowerCase();
  let queryOrYtUrl = args.slice(0, args.length - 1).join(' ');
  
  let internalDownloadFormat; 

  if (userRequestedTypeOrQuality === audioTypeKeyword) {
      internalDownloadFormat = audioTypeKeyword; 
  } else if (userRequestedTypeOrQuality === genericVideoKeyword) {
      internalDownloadFormat = '720p'; 
  } else if (specificVideoQualities.includes(userRequestedTypeOrQuality)) {
      internalDownloadFormat = userRequestedTypeOrQuality; 
  } else {
      return m.reply(helpMessage);
  }

  if (!queryOrYtUrl.trim()) {
      return m.reply(`*Invalid format!* Please provide a YouTube URL or search query.`);
  }

  m.react(WAIT_REACTION);

  try {
    const downloadResult = await yt.download(queryOrYtUrl, internalDownloadFormat);

    let contentCaption = `*${downloadResult.ftype === 'mp3' ? '🎶' : '🎥'} ✅ YouTube Download Successful!*
*${downloadResult.ftype === 'mp3' ? '🎵' : '🎬'} Title:* ${downloadResult.title || 'N/A'}
*Type:* ${downloadResult.ftype.toUpperCase()}
*Quality:* ${downloadResult.fquality || 'N/A'}`; 

    if (downloadResult.dlink) {
        let thumbnailBuffer = null;
        if (downloadResult.thumb) {
            try {
                thumbnailBuffer = await (await fetch(downloadResult.thumb)).buffer();
            } catch (thumbnailError) {
                console.error("[YTDownloader] Failed to fetch thumbnail:", thumbnailError.message);
            }
        }

        if (downloadResult.ftype === 'mp3') {
            
            await m.reply(contentCaption);

            await conn.sendFile(m.chat, downloadResult.dlink, `${downloadResult.title}.mp3`, '', m, false, {
                mimetype: 'audio/mpeg',
                thumbnail: thumbnailBuffer 
            });

        } else {
            contentCaption += `\n*🔗 Download Link:* ${downloadResult.dlink || 'N/A'}`; 
            await conn.sendFile(m.chat, downloadResult.dlink, `${downloadResult.title}.mp4`, contentCaption, m, false, {
                mimetype: 'video/mp4',
                thumbnail: thumbnailBuffer
            });
        }
        m.react(SUCCESS_REACTION);
    } else {
        throw new Error("Download link not found in response.");
    }

  } catch (e) {
    console.error(`Error in YouTube Downloader handler (${command}):`, e);
    m.reply(`*❌ Failed to download from YouTube!* Error: ${e.message}`);
    m.react(ERROR_REACTION);
  }
};

handler.help = ['play-media']; 
handler.tags = ['downloader'];
handler.command = /^(play-media)$/i; 
handler.limit = true
export default handler;
