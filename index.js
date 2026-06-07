const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = 3000;

// 1. ระบบ Web Server เพื่อกันบอทหลับบน Render
app.get('/', (req, res) => {
    res.send('Jolly is awake!');
});

app.listen(port, () => {
    console.log(`Web Server พร้อมทำงานที่พอร์ต ${port}`);
});

// 2. สร้างตัวแปร client พร้อมเปิดสิทธิ์บอทเพลงและระบบอ่านแชทแบบครบถ้วน
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,     // สิทธิ์สำหรับอ่านลิงก์เพลงในช่องแชท
        GatewayIntentBits.GuildVoiceStates    // สิทธิ์สำหรับให้บอทเชื่อมต่อเข้าห้องเสียง (VC)
    ]
});

client.once('ready', () => {
    console.log(`บอท Jolly ออนไลน์แล้วในฐานะ: ${client.user.tag}`);
});

// =======================================================
// 3. ระบบบอทเพลง JOLLY MUSIC (ย้ายมาอยู่ตรงนี้ก่อนถึงบรรทัดล็อกอิน)
// =======================================================
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SpotifyPlugin } = require('@distube/spotify');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const distube = new DisTube(client, {
    plugins: [new YouTubePlugin(), new SpotifyPlugin()],
    leaveOnFinish: false, 
    emitNewSongOnly: true
});

// 🆔 ไอดีห้อง #ใส่เพลง ของคุณใส่ไว้ตรงนี้เรียบร้อยแล้ว
const MUSIC_CHANNEL_ID = '1513129957641949247'; 

let leaveTimeout = null;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== MUSIC_CHANNEL_ID) return;

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.reply('❌ คุณต้องเข้าห้องเสียง (VC) ก่อนถึงจะสั่งเปิดเพลงได้ครับ!');
    }

    const query = message.content.trim();
    if (!query) return;

    if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
    }

    try {
        await message.channel.send('🎵 **เพลงจะมาภายใน 3 วิ...**');
        await distube.play(voiceChannel, query, {
            textChannel: message.channel,
            member: message.member
        });
    } catch (error) {
        console.error(error);
        message.channel.send('❌ เกิดข้อผิดพลาด ไม่สามารถดึงลิงก์นี้มาเล่นได้ครับ');
    }
});

distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
        .setTitle(`💿 กำลังเปิดเพลง: ${song.name}`)
        .setURL(song.url)
        .setThumbnail(song.thumbnail)
        .setColor('#1DB954')
        .addFields(
            { name: '⏳ ความยาว', value: song.formattedDuration, inline: true },
            { name: '👤 คนขอเพลง', value: `${song.user}`, inline: true },
            { name: '🎼 เพลงถัดไปในคิว', value: `${queue.songs.length - 1} เพลง`, inline: true }
        )
        .setFooter({ text: 'บอท Jolly ระบบจัดการเพลงอัตโนมัติ' });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_pause_resume').setLabel('⏸️ เล่น/หยุด').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('music_skip').setLabel('⏭️ ข้ามเพลง').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_stop').setLabel('⏹️ ปิดเพลง/ล้างคิว').setStyle(ButtonStyle.Danger)
    );

    queue.textChannel.send({ embeds: [embed], components: [buttons] });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '⚠️ ขณะนี้ไม่มีเพลงเล่นอยู่ในคิวครับ', ephemeral: true });

    if (interaction.customId === 'music_pause_resume') {
        if (queue.paused) {
            queue.resume();
            await interaction.reply({ content: '▶️ เล่นเพลงต่อเรียบร้อยแล้ว', ephemeral: true });
        } else {
            queue.pause();
            await interaction.reply({ content: '⏸️ หยุดเพลงชั่วคราวแล้ว', ephemeral: true });
        }
    } else if (interaction.customId === 'music_skip') {
        try {
            if (queue.songs.length <= 1) {
                queue.stop();
                await interaction.reply({ content: '⏭️ ไม่มีเพลงต่อในคิว ระบบปิดเพลงให้แล้วครับ', ephemeral: true });
            } else {
                await distube.skip(interaction.guildId);
                await interaction.reply({ content: '⏭️ ข้ามเพลงให้แล้วครับ', ephemeral: true });
            }
        } catch (err) {
            await interaction.reply({ content: '❌ ไม่สามารถข้ามเพลงได้', ephemeral: true });
        }
    } else if (interaction.customId === 'music_stop') {
        queue.stop();
        await interaction.reply({ content: '⏹️ ปิดเพลงและล้างคิวเพลงทั้งหมดเรียบร้อยแล้วครับ', ephemeral: true });
    }
});

distube.on('finish', (queue) => {
    queue.textChannel.send(`⚠️ **เพลงหมดคิวแล้ว!** ถ้ายังไม่กรอกเพลงภายใน 20 วินาที บอทจะทำการออก VC ทันที!`);

    leaveTimeout = setTimeout(() => {
        const checkQueue = distube.getQueue(queue.id);
        if (!checkQueue || checkQueue.songs.length === 0) {
            distube.voices.leave(queue.id);
            queue.textChannel.send('🚪 บอทออกจากห้องเสียง (VC) เรียบร้อยเนื่องจากไม่มีการส่งเพลงเพิ่มเติมครับ');
        }
    }, 20000);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ เพิ่มเพลง **${song.name}** เข้าสู่คิวเรียบร้อยแล้วคิวต่อไปเตรียมรันเลย!`);
});

// =======================================================
// 🛑 บรรทัดล็อกอิน (ต้องอยู่ล่างสุดของไฟล์แบบนี้เสมอ)
// =======================================================
client.login('MTUxMzeNzExNzKxNDc1NzczNTU1NG.Gfkk8r.GsKomloSIIS3CJAf3H7KtwkzZUFdLFolG0Hg2U');
