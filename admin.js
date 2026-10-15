// admin.js - ระบบเสกเงินและจัดการยศเฉพาะแอดมิน
module.exports = {
    handleAdminCommands: async (message, userBalances, userRobloxNames) => {
        // กำหนด ID แอดมิน หรือเปิดให้เจ้าของเซิร์ฟเวอร์ใช้คำสั่งได้
        // คำสั่งเสกเงิน: !addmoney @ user 1000 หรือ !addmoney 1000
        if (message.content.startsWith('!addmoney')) {
            const args = message.content.split(' ');
            const targetUser = message.mentions.users.first() || message.author;
            
            // หาจำนวนเงินจากคำสั่ง
            let amount = 1000;
            if (message.mentions.users.first()) {
                amount = parseFloat(args[2]) || 1000;
            } else {
                amount = parseFloat(args[1]) || 1000;
            }

            const currentBal = userBalances.get(targetUser.id) || 0;
            userBalances.set(targetUser.id, currentBal + amount);

            await message.reply(`💳 **[ADMIN]** เพิ่มเงินให้ <@${targetUser.id}> จำนวน **${amount}** บาท เรียบร้อย! (ยอดเงินปัจจุบัน: ${currentBal + amount} ฿)`);
        }

        // คำสั่งรีเซ็ตเงิน: !resetmoney @ user
        if (message.content.startsWith('!resetmoney')) {
            const targetUser = message.mentions.users.first() || message.author;
            userBalances.set(targetUser.id, 0);
            await message.reply(`🧹 **[ADMIN]** ล้างยอดเงินของ <@${targetUser.id}> เป็น 0 ฿ เรียบร้อยแล้ว`);
        }
    }
};
