const { REST, Routes } = require('discord.js');
const { TOKEN, GUILD_ID } = require('./config');

const commands = [
    { name: 'playtime', description: 'Xem giờ chơi', options: [{ name: 'member', type: 6, description: 'Người cần xem', required: false }] },
    { name: 'point', description: 'Xem số điểm của bạn' },
    { name: 'check', description: 'Xem điểm người khác', options: [{ name: 'member', type: 6, description: 'Người cần xem', required: false }] },
    { name: 'daily', description: 'Nhận quà daily' },
    { name: 'top', description: 'Top 15 người có điểm cao nhất' },
    { name: 'shop', description: 'Xem shop role màu' },
    { name: 'buy', description: 'Mua/gia hạn role màu', options: [{ name: 'role_name', type: 3, description: 'Tên role', required: true }] },
    { name: 'rename', description: 'Đổi tên role màu', options: [{ name: 'new_name', type: 3, description: 'Tên mới', required: true }] },
    { name: 'timerole', description: 'Xem hạn sử dụng role' },
    { name: 'xoamau', description: 'Xoá màu + role đổi tên' },
    { name: 'nhanqua', description: 'Nhận quà sự kiện gacha' },
    { name: 'help', description: 'Hiển thị tất cả lệnh' },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🚀 Đang deploy slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(TOKEN.split('.')[0], GUILD_ID), // chỉ guild này
            { body: commands }
        );
        console.log('✅ Đã deploy thành công slash commands!');
    } catch (error) {
        console.error(error);
    }
})();
