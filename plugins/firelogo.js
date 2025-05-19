import axios from 'axios';

let handler = async (m, { conn, args }) => {
  try {
    const text = args.join(' ');
    if (!text) return conn.reply(m.chat, 'Please provide text to generate the logo.', m);

    const params = {
      _comBuyRedirect: "false",
      script: "fire-logo",
      text,
      symbol_tagname: "popular",
      fontsize: "70",
      fontname: "Cry Uncial",
      fontname_tagname: "cool",
      textBorder: "20",
      growSize: "0",
      antialias: "on",
      hinting: "on",
      justify: "2",
      letterSpacing: "0",
      lineSpacing: "0",
      textSlant: "0",
      textVerticalSlant: "0",
      textAngle: "0",
      textOutline: "false",
      textOutlineSize: "2",
      textColor: "#000000",
      fireSize: "70",
      backgroundResizeToLayers: "on",
      backgroundRadio: "1",
      backgroundColor: "#000000",
      backgroundPattern: "Wood",
      backgroundPattern_tagname: "standard",
      backgroundGradient: "Web20 Blue 3D #10",
      backgroundGradient_tagname: "standard",
      backgroundGradientAngle: "180",
      backgroundGradientCenterX: "50",
      backgroundGradientCenterY: "50",
      backgroundStarburstColorAlt: "#ED2400",
      backgroundStarburstColor1: "#BD2409",
      backgroundStarburstNum: "25",
      backgroundStarburstRayPercentage: "50",
      backgroundStarburstUseColor2: "false",
      backgroundStarburstColor2: "#000000",
      backgroundStarburstOffsetAngle: "0",
      backgroundStarburstXOffset: "0",
      backgroundStarburstYOffset: "0",
      backgroundStarburstCenterPercentage: "2",
      backgroundStarburstRadiusX: "1000",
      backgroundStarburstRadiusY: "1000",
      backgroundStarburstCF1: "0",
      backgroundUseOverlay: "off",
      backgroundOverlayMode: "5",
      backgroundOverlayPattern: "Parque #1",
      backgroundOverlayPattern_tagname: "standard",
      backgroundOverlayOpacity: "100",
      backgroundImageUrl: "https://www.flamingtext.com/images/textures/texture3.jpg",
      useFixedSize: "false",
      imageWidth: "400",
      imageHeight: "150",
      imageAlignment: "4",
      autocrop: "false",
      autocropPadding: "0",
      watermark: "none",
      ext: "png",
      jpgQuality: "85",
      doScale: "off",
      scaleWidth: "240",
      scaleHeight: "120",
      _: Date.now()
    };

    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': 'https://www.flamingtext.com/logo/Design-Fire'
    };

    const response = await axios.get('https://www.flamingtext.com/net-fu/image_output.cgi', { params, headers });

    let imageUrl;
    if (typeof response.data === 'string') {
      try {
        const parsed = JSON.parse(response.data);
        imageUrl = parsed.src;
      } catch {
        imageUrl = response.data.match(/src\s*:\s*"(.*?)"/)?.[1];
      }
    } else if (typeof response.data === 'object') {
      imageUrl = response.data.src;
    }

    if (!imageUrl) return conn.reply(m.chat, 'Failed to retrieve the image URL.', m);

    // Send the image URL as a photo to the chat
    await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption: `Logo for "${text}"` }, { quoted: m });

  } catch (error) {
    console.error(error);
    conn.reply(m.chat, 'An error occurred while generating the logo.', m);
  }
};

handler.help = ['firelogo'];
handler.tags = ['tools'];
handler.command = ['firelogo'];
handler.limit = true;
export default handler;
