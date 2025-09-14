// Instagram: noureddine_ouafy
import fetch from 'node-fetch';

/**
 * Generate a random string of given length
 */
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Fetch location data from OpenStreetMap API
 */
const fetchLocationData = async (text, retries = 3, delayMs = 1000) => {
  const randomAppName = `AppName${generateRandomString(5)}`;
  const randomEmail = `user${generateRandomString(5)}@example.com`;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1`;
  const options = {
    headers: {
      'User-Agent': `${randomAppName}/1.0 (${randomEmail})`
    }
  };

  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 200) {
      const data = await res.json();
      if (data.length === 0) throw new Error(`City ${text} not found!`);
      return data[0];
    } else if (res.status === 403) {
      if (i < retries - 1) {
        await delay(delayMs); // Retry after delay
        continue;
      } else {
        throw new Error('Error fetching data: Forbidden');
      }
    } else {
      throw new Error(`Error fetching data: ${res.statusText}`);
    }
  }
};

/**
 * Command handler for map search
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*Example:* ${usedPrefix + command} Casablanca`;

  try {
    await m.reply('Please wait...');

    const location = await fetchLocationData(text);
    const city = location.display_name;
    const latitude = location.lat;
    const longitude = location.lon;

    const locationInfo = `City: ${city}\nLatitude: ${latitude}\nLongitude: ${longitude}`;

    // Send location on WhatsApp
    await conn.sendMessage(
      m.chat,
      { location: { degreesLatitude: parseFloat(latitude), degreesLongitude: parseFloat(longitude) } },
      { ephemeralExpiration: 604800 }
    );

    await delay(2000);
    await conn.reply(m.chat, locationInfo, m);

  } catch (e) {
    await conn.reply(m.chat, `Error: ${e.message || e}`, m);
  }
};

handler.help = handler.command = ['maps'];
handler.tags = ['tools'];
handler.premium = false;

export default handler;

/**
 * Delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
