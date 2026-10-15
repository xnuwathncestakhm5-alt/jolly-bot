require('dotenv').config();

// --- Express Web Server สำหรับ UptimeRobot / Render Health Check ---
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Nate Bot is Online 24/7!'));
app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('Web server is running...'));
// ----------------------------------------------------------------------

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    InteractionType,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
const noblox = require('noblox.js');
const voucher = require('truemoney-voucher');
const adminSystem = require('./admin.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const userBalances = new Map(); 
const userRobloxNames = new Map(); 

// ใช้ Cookie ที่คุณส่งมาโดยตรง (หรือดึงจาก Environment Variables หากมี)
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE || '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEQAhoGCAIQBBgBIhsKBGR1aWQSEzQ5Mzc0MTQ3OTU1ODcyNzk5MTMiEwoFdW5hbWUSCkJyX2lnaHQ1NjciEQoDdWlkEgoyODc0MjgyNTY4KAM.uOZ-ZLzbVPOzdn0FcoCvLrL32QumVhXbge8HVm9bqYgZM004UJpl-KIaDLAKmsAv2DDuCZ1zng3GGRUKGaSQJhDPJaeO-40q0Y7l_mAYF0mzjGQG4ywVR8SNHCkwt9D0RyM67Apn0kI5nZ0QvK6YpIUmIn9fC4mzoMzHk3pzPAx_K7I5rbAH-3VbgnvofPgcrtnZ3GQrihDBbjvu6hHReFbGXoqY7oFcP5EDESNHCf8g8ly8zSPQoxysvv_WFsd6LqbBVSffiLecxxBrnsKmGecO6aMZgxOISmy_lUL8KRPMGSEe0qbSV4MmkSoHrwv5d018NgrBe_jIapOXYMbqwkvQZr5yiBUBX4sRFonDr-Z0iK27G6VWPHqxfvympPZl3XubOwFPr8kO6gbVpu-78dXaxmikkgMH5nn2An-9999c_TKGV2zk9PE0pnu7pB3QWtV5vvcs4NF3-eI60D2RbLL8pmzc2d59X4A-MfwKA7_s4l_tzbOq7uz69RfnUPbfwKC83HQffnAFzA9IB4ljXmzlQ-SUXH7PhP-UUxpdHN1I1d1ieO-EfEliiCEMw__TRCGddOO6s3zvjzqAJhfWp05sqz-u_R62SYTYfYjebtFyVErB2sjpsKb5yCrrAsSkbbfsOFG9SBiohN4PJj_1GB1oedZDdDFDlYehbrjpBAkOAYsPr4WfvGaIPFhuRWepF3o9RI_-GWnHmIQfv0cgZyFLXg1FlXPpaQVtKZ0thLVE3KVMQ89Hqyk-IBiwx1EQimkuky0llvR05DkbYeo8V6XzPuRRlmUNWIqgGM78MapMx_qXErsJo6sKqK9MHUm4o-HQaWDNbHmxPF3cs3qrolbv9tEefn3a3djJkXyULt6XT9U7G5vk8C-6bf5ZVY-_XijKsOzbbiWeI40T_9_4mg.G55H5VICF_-RGw_QofP47YvUKFA';

const RANKS_FOR_SALE = [
    { label: '[OR-3] Lance corporal | สิบตรี', value: 'rank_or3', price: 20, roleId: 3 },
    { label: '[OR-4] Corporal | สิบโท', value: 'rank_or4', price: 30, roleId: 4 },
    { label: '[OR-5] Sergeant | สิบเอก', value: 'rank_or5', price: 40, roleId: 5 },
    { label: '[OR-6] Sergeant Major 3rd Class | จ่าสิบตรี', value: 'rank_or6', price: 55, roleId: 6 },
    { label: '[OR-7] Sergeant Major 2nd Class | จ่าสิบโท', value: 'rank_or7', price: 75, roleId: 7 },
    { label: '[OR-8] Sergeant Major 1st Class | จ่าสิบเอก', value: 'rank_or8', price: 80, roleId: 8 },
    { label: '[OF-1A] Second Lieutenant | ร้อยตรี', value: 'rank_of1a', price: 90, roleId: 11 },
    { label: '[OF-1B] Lieutenant | ร้อยโท', value: 'rank_of1b', price: 120, roleId: 12 },
    { label: '[OF-2] Captain | ร้อยเอก', value: 'rank_of2', price: 150, roleId: 13 },
    { label: '[OF-3] Major | พันตรี', value: 'rank_of3', price: 190, roleId: 14 },
    { label: '[OF-4] Lieutenant Colonel | พันโท', value: 'rank_of4', price: 250, roleId: 15 },
    { label: '[OF-5] Colonel | พันเอก', value: 'rank_of5', price: 300, roleId: 16 },
    { label: '[OF-6] Senior Colonel | พันเอกพิเศษ', value: 'rank_of6', price: 360, roleId: 17 },
    { label: '[OF-7] Major General | พลตรี', value: 'rank_of7', price: 400, roleId: 18 },
    { label: '[OF-8] Lieutenant General | พลโท', value: 'rank_of8', price: 490, roleId: 20 },
    { label: '[OF-9] GENERAL | พลเอก', value: 'rank_of9', price: 500, roleId: 21 },
    { label: '[ Expert Royal Thai Army | ผู้ทรงคุณวุฒิกองทัพบก ]', value: 'rank_expert', price: 600, roleId: 22 }
];

// นิยามคำสั่ง /setup-shop
const commands = [
    new SlashCommandBuilder()
        .setName('setup-shop')
        .setDescription('เปิดหน้าต่างตั้งค่าและติดตั้งหน้าร้านค้า')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Log in as \${client.user.tag}`);
    
    // ลงทะเบียน Slash Commands อัตโนมัติ
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        console.log('กำลังลงทะเบียน Slash Commands (/)...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ ลงทะเบียน Slash Commands สำเร็จ!');
    } catch (error) {
        console.error('❌ ลงทะเบียน Slash Commands ไม่สำเร็จ:', error);
    }

    try {
        await noblox.setCookie(ROBLOX_COOKIE);
        const botUser = await noblox.getAuthenticatedUser();
        console.log(`Roblox Logged in as: \${botUser.UserName}`);
    } catch (err) {
        console.error('Roblox Login Failed:', err);
    }
});

// ฟังคำสั่งในแชทปกติ (สำหรับ admin.js)
client.on('messageCreate', async (message) => {
    await adminSystem.handleAdminCommands(message, userBalances, userRobloxNames);
});

// ฟัง Interaction (Slash Commands, Buttons, Menus, Modals)
client.on('interactionCreate', async (interaction) => {
    try {
        // 1. จัดการ Slash Command: /setup-shop
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'setup-shop') {
                const adminEmbed = new EmbedBuilder()
                    .setTitle('🛠️ ระบบจัดการร้านค้า — Auto Shop')
                    .setDescription('กดปุ่มด้านล่างเพื่อส่ง UI หน้าร้านค้าซื้อยศลงในช่องนี้')
                    .setColor('#2563EB');

                const adminRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('send_shop_ui_btn')
                        .setLabel('🛒 ส่ง UI ร้านค้า')
                        .setStyle(ButtonStyle.Success)
                );

                await interaction.reply({ 
                    embeds: [adminEmbed], 
                    components: [adminRow], 
                    flags: 64 // เห็นเฉพาะแอดมินที่ใช้คำสั่ง
                });
            }
        }

        // 2. จัดการการกดปุ่ม (Buttons)
        if (interaction.isButton()) {
            const userId = interaction.user.id;
            const currentBalance = userBalances.get(userId) || 0;
            const savedRobloxName = userRobloxNames.get(userId);

            // ปุ่มแอดมินกดสั่งส่ง UI ร้านค้า
            if (interaction.customId === 'send_shop_ui_btn') {
                const shopEmbed = new EmbedBuilder()
                    .setTitle('🟢 โดเนท')
                    .setDescription('ระบบซื้อยศอัตโนมัติ - เปิดบริการ 24 ชั่วโมง')
                    .setColor('#10B981')
                    .setImage('https://kommodo.ai/i/QekVzsP7LKeL1HfcBLlH');

                const shopRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('buy_rank_btn')
                        .setLabel('ซื้อยศ Roblox')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('topup_btn')
                        .setLabel('เติมเงิน — TrueWallet')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('check_balance_btn')
                        .setLabel('ดูยอดเงิน')
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.channel.send({ embeds: [shopEmbed], components: [shopRow] });
                return await interaction.reply({ content: '✅ ส่ง UI หน้าร้านค้าเรียบร้อยแล้ว!', flags: 64 });
            }

            if (interaction.customId === 'buy_rank_btn') {
                if (!savedRobloxName) {
                    const modal = new ModalBuilder()
                        .setCustomId('roblox_name_modal')
                        .setTitle('กรอกชื่อ Roblox ของคุณ');

                    const nameInput = new TextInputBuilder()
                        .setCustomId('roblox_username')
                        .setLabel('ชื่อ Roblox Username')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('ตัวอย่าง: Br_ight567')
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                    return await interaction.showModal(modal);
                }

                await interaction.deferReply({ flags: 64 });

                let currentRankText = 'ไม่พบข้อมูลยศ';
                try {
                    const robloxId = await noblox.getIdFromUsername(savedRobloxName);
                    console.log('กำลังเช็กยศในกลุ่ม ID:', process.env.ROBLOX_GROUP_ID, 'ของ ID:', robloxId);
                    currentRankText = await noblox.getRankNameInGroup(process.env.ROBLOX_GROUP_ID, robloxId);
                } catch (e) {
                    console.error('❌ ดึงยศไม่สำเร็จเพราะ:', e.message);
                    currentRankText = 'ยังไม่ได้เข้ากลุ่ม หรือไม่พบชื่อ';
                }

                const confirmEmbed = new EmbedBuilder()
                    .setTitle('ยืนยันข้อมูลของคุณ')
                    .setDescription('กรุณาตรวจสอบข้อมูลด้านล่าง ว่าใช่บัญชีที่คุณต้องการซื้อยศหรือไม่')
                    .setColor('#2563EB')
                    .addFields({
                        name: 'ข้อมูล',
                        value: `\`\`\`Roblox : ${savedRobloxName}\nยศปัจจุบัน : ${currentRankText}\nยอดเงิน : ${currentBalance} ฿\`\`\``
                    });

                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_identity_yes')
                        .setLabel('ใช่ ข้อมูลของฉัน')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('confirm_identity_no')
                        .setLabel('ไม่ใช่ข้อมูลของฉัน')
                        .setStyle(ButtonStyle.Secondary)
                );

                return await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] });
            }

            if (interaction.customId === 'confirm_identity_yes') {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_rank_menu')
                    .setPlaceholder('เลือกยศที่ต้องการซื้อ')
                    .addOptions(
                        RANKS_FOR_SALE.map(rank => ({
                            label: rank.label,
                            description: `ราคา \${rank.price} บาท`,
                            value: rank.value
                        }))
                    );

                const rankEmbed = new EmbedBuilder()
                    .setTitle('เลือกยศที่ต้องการซื้อ')
                    .setDescription('เลือกยศที่ต้องการจากเมนูด้านล่าง')
                    .setColor('#F59E0B');

                await interaction.update({ embeds: [rankEmbed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
            }

            if (interaction.customId === 'confirm_identity_no') {
                const modal = new ModalBuilder()
                    .setCustomId('roblox_name_modal')
                    .setTitle('แก้ไขชื่อ Roblox ของคุณ');

                const nameInput = new TextInputBuilder()
                    .setCustomId('roblox_username')
                    .setLabel('ชื่อ Roblox Username ใหม่')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'topup_btn') {
                const modal = new ModalBuilder()
                    .setCustomId('topup_modal')
                    .setTitle('เติมเงินผ่าน TrueMoney Wallet');

                const walletInput = new TextInputBuilder()
                    .setCustomId('truemoney_link')
                    .setLabel('ลิงก์ซองเปา TrueMoney')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://gift.truemoney.com/campaign/?v=...')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(walletInput));
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'check_balance_btn') {
                const embed = new EmbedBuilder()
                    .setTitle('💎 ยอดของคุณ')
                    .setDescription(`\`\`\`ยอดคงเหลือ : ${currentBalance} ฿\`\`\``)
                    .setColor('#3B82F6');

                await interaction.reply({ embeds: [embed], flags: 64 });
            }
        }

        // 3. จัดการการส่งฟอร์ม (Modal Submit)
        if (interaction.type === InteractionType.ModalSubmit) {
            
            if (interaction.customId === 'roblox_name_modal') {
                const robloxName = interaction.fields.getTextInputValue('roblox_username');
                userRobloxNames.set(interaction.user.id, robloxName);

                await interaction.reply({ 
                    content: `บันทึกชื่อ Roblox: **${robloxName}** เรียบร้อยแล้ว! กรุณากดปุ่ม **ซื้อยศ Roblox** อีกครั้ง`, 
                    flags: 64
                });
            }

            if (interaction.customId === 'topup_modal') {
                const voucherLink = interaction.fields.getTextInputValue('truemoney_link');
                await interaction.deferReply({ flags: 64 });

                try {
                    const result = await voucher(process.env.PHONE_NUMBER, voucherLink);
                    const amount = parseFloat(result.amount);
                    const currentBal = userBalances.get(interaction.user.id) || 0;
                    userBalances.set(interaction.user.id, currentBal + amount);

                    await interaction.editReply({
                        content: `✅ เติมเงินสำเร็จจำนวน **${amount}** บาท! ยอดเงินคงเหลือของคุณคือ **${currentBal + amount}** บาท`
                    });
                } catch (err) {
                    await interaction.editReply({ content: '❌ ลิงก์ซองอั่งเปาไม่ถูกต้อง หรือถูกใช้งานไปแล้ว' });
                }
            }
        }

        // 4. จัดการการเลือกในดร็อปดาวน์ (Select Menu)
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_rank_menu') {
            const selectedValue = interaction.values[0];
            const rankInfo = RANKS_FOR_SALE.find(r => r.value === selectedValue);
            const userId = interaction.user.id;
            const balance = userBalances.get(userId) || 0;
            const robloxName = userRobloxNames.get(userId);

            if (balance < rankInfo.price) {
                return await interaction.reply({ 
                    content: `❌ ยอดเงินของคุณไม่พอ! ยศนี้ราคา ${rankInfo.price} ฿ แต่งวดเงินของคุณมีเพียง ${balance} ฿`, 
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            try {
                const robloxId = await noblox.getIdFromUsername(robloxName);
                const rankInGroup = await noblox.getRankInGroup(process.env.ROBLOX_GROUP_ID, robloxId);
                
                if (rankInGroup === 0) {
                    return await interaction.editReply({
                        content: `⚠️ คุณยังไม่ได้เข้ากลุ่ม Roblox!\nกรุณาเข้ากลุ่มผ่านลิงก์นี้ก่อนสั่งซื้อ: https://www.roblox.com/th/communities/33706192/Royal-Thai-Army#!/about`
                    });
                }

                await noblox.setRank(process.env.ROBLOX_GROUP_ID, robloxId, rankInfo.roleId);
                userBalances.set(userId, balance - rankInfo.price);

                await interaction.editReply({
                    content: `🎉 ขอบคุณที่ซื้อยศ! ระบบได้ปรับยศ **${rankInfo.label}** ให้กับไอดี **${robloxName}** เรียบร้อยแล้ว`
                });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการปรับยศ กรุณาติดต่อแอดมิน' });
            }
        }
    } catch (err) {
        console.error('Interaction Error:', err);
    }
});

client.login(process.env.DISCORD_TOKEN);
