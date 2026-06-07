const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = 3000;

// ระบบ Web Server เพื่อกันบอทหลับ
app.get('/', (req, res) => {
  res.send('Jolly is awake!');
});
app.listen(port, () => {
  console.log(`Web Server พร้อมทำงานที่พอร์ต ${port}`);
});

// ส่วนของบอท Jolly
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`บอท Jolly ออนไลน์แล้วในฐานะ ${client.user.tag}`);
});

// ใส่ Token ตรงนี้
client.login(process.env.DISCORD_TOKEN);