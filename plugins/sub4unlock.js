/*
plugin by : noureddine ouafy 
scrape by : Fik
Base  : https://sub4unlock.io
Adjusted Handler + Guide Example
*/

import axios from 'axios'

class Sub4Unlock {
    constructor() {
        this.endpoint = 'https://sub4unlock.io/ajax.php'
        this.headers = {
            'authority': 'sub4unlock.io',
            'accept': '*/*',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': 'https://sub4unlock.io',
            'referer': 'https://sub4unlock.io/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10) Chrome Mobile',
            'x-requested-with': 'XMLHttpRequest'
        }
    }

    validate(payload) {
        if (!payload['file-link']) {
            throw new Error('Destination link is required')
        }

        const hasAction = Object.keys(payload).some(
            key => key.startsWith('link-') && payload[key]
        )

        if (!hasAction) {
            throw new Error('At least one social action is required')
        }
    }

    mapParams(params) {
        return {
            'link-1': params.youtubeSubscribe || '',
            'link-2': params.instagramFollow || '',
            'link-3': params.telegramJoin || '',
            'link-4': params.discordJoin || '',
            'file-link': params.destination || ''
        }
    }

    async create(params) {
        const data = this.mapParams(params)
        this.validate(data)

        const body = new URLSearchParams(data).toString()

        const res = await axios.post(this.endpoint, body, {
            headers: this.headers
        })

        if (!res.data || !res.data.includes('sub4unlock.io')) {
            throw new Error('Failed to generate Sub4Unlock link')
        }

        return res.data.trim()
    }
}

/* ================= HANDLER ================= */

let handler = async (m, { conn, text }) => {
    if (!text) {
        return conn.reply(
            m.chat,
            `📘 *Sub4Unlock Guide*

🔹 What is this?
This command locks a link behind social actions (subscribe, follow, join).

🔹 Command Format:
.sub4unlock <destination> | <actions>

🔹 Example:
.sub4unlock instagram.com/noureddine_ouafy | yt=https://youtube.com/@noureddineouafy2 | ig=instagram.com/noureddine_ouafy

🔹 Supported Actions:
yt = YouTube Subscribe
ig = Instagram Follow
tg = Telegram Join
dc = Discord Join

⚠️ At least one action is required.`,
            m
        )
    }

    try {
        const parts = text.split('|').map(v => v.trim())
        const destination = parts.shift()

        let params = { destination }

        for (let part of parts) {
            let [key, value] = part.split('=')
            if (!value) continue

            if (key === 'yt') params.youtubeSubscribe = value
            if (key === 'ig') params.instagramFollow = value
            if (key === 'tg') params.telegramJoin = value
            if (key === 'dc') params.discordJoin = value
        }

        const sub4unlock = new Sub4Unlock()
        const result = await sub4unlock.create(params)

        conn.reply(
            m.chat,
            `✅ *Sub4Unlock Link Generated*

🔗 ${result}

Users must complete the required social actions to unlock the link.`,
            m
        )
    } catch (err) {
        conn.reply(m.chat, `❌ Error: ${err.message}`, m)
    }
}

handler.help = ['sub4unlock']
handler.command = ['sub4unlock']
handler.tags = ['tools']
handler.limit = true

export default handler
