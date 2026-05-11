const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH TRỰC TIẾP ---
const DISCORD_TOKEN = "MTQ5NDcodenaygia9MaI"; 
const CLIENT_ID = "1494553729847001179"; 
const GUILD_ID = "1389473239754997870";

const commands = [];

// 1. Load các lệnh từ thư mục commands/ (Phần gốc)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.data) {
            commands.push(command.data);
        }
    }
}

// 2. Thêm các lệnh Card Game (Phần mới - ĐÃ THÊM DESCRIPTION)
const cardCommands = [
    { 
        name: 'tuido', 
        description: 'Xem danh sách thẻ bài trong túi đồ của bạn' 
    },
    {
        name: 'show',
        description: 'Hiển thị thẻ bài cho mọi người xem',
        options: [{ 
            name: 'id', 
            description: 'Số thứ tự của thẻ bài', 
            type: 4, 
            required: true 
        }]
    },
    { 
        name: 'nangcapthe', 
        description: 'Nâng cấp sao cho thẻ bài của bạn' 
    }
];

commands.push(...cardCommands);

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Đang đăng ký ${commands.length} slash commands...`);
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('✅ Đăng ký slash commands thành công!');
    } catch (error) {
        console.error('❌ Lỗi khi deploy:', error);
    }
})();