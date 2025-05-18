import { areJidsSameUser } from "@adiwajshing/baileys"; 

let handler = async (m, { conn, participants }) => { 
   let users = participants.filter((u) => !areJidsSameUser(u.id, conn.user.id)); 
   let kickedUser = []; 
   for (let user of users) { 
     if (user.id.endsWith("@s.whatsapp.net") && !user.admin) { 
       await kickedUser.push(user.id); 
       await delay(1 * 1000); 
     } 
   } 
   if (!kickedUser.length >= 1) 
     return m.reply("*SUCCESS COUP D'ETAT 🏴*\n> *All members have been successfully removed!*"); 
   const res = await conn.groupParticipantsUpdate(m.chat, kickedUser, "remove"); 
   await delay(1 * 1000); 
   await m.reply( 
     `*Successfully removed all members*\n${kickedUser.map( 
       (v) => "@" + v.split("@")[0] 
     )}`, 
     null, 
     { 
       mentions: kickedUser, 
     } 
   ); 
}; 

handler.tags = ['owner'];
handler.help = ['removenonadmins']; 
handler.command = /^(removenonadmins)$/i; 
handler.owner = true; 
handler.group = true; 
handler.botAdmin = true; 
export default handler;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
