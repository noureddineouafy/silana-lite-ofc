import cron from "node-cron";

async function delay(ms) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export async function schedule(db, conn) {
    // The problematic line has been removed.

    cron.schedule('0 0 0 * * *', async () => { // schedule to run at 12:00 AM every day
        let data = Object.keys(db.data.users);
        let grup = Object.keys(db.data.chats).filter(v => v.endsWith('@g.us'));
        let user = db.data.users;

        for (let usr of data) {
            if (user[usr].limit < 7) {
                user[usr].limit = 20;
            }
        }

        for (let gc of grup) {
            await conn.reply(gc, '```The system has reset the limit of all users who have a value below 7```', null);
            await delay(5000);
        }
    }, {
        scheduled: true,
        timezone: "Africa/Casablanca"
    });
}
