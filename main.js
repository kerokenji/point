const { Client, GatewayIntentBits, Collection, PermissionFlagsBits } = require('discord.js');
const { initPointsDB, handleChatMessage } = require('./utils/db');
const setupVoiceTracker = require('./features/voiceTracker'); 
const fs = require('fs');
const path = require('path');

// --- IMPORT TÍNH NĂNG CARD GAME (MỚI GỘP) ---
const { spawnCard } = require('./game_engine');
const cron = require('node-cron');
const CARD_CHANNEL_ID = '1295359113110225042'; // ID kênh thả thẻ từ index_card

// --- IMPORT TÍNH NĂNG TAG SYSTEM ---
const { startTag, stopTag } = require('./tagSystem');

// --- IMPORT TÍNH NĂNG WELCOME ---
const setupWelcome = require('./features/welcome');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Khởi chạy các tính năng
setupWelcome(client);
setupVoiceTracker(client); 

client.commands = new Collection();

// Load tất cả commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ====================== SLASH COMMANDS ======================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Lỗi slash command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Có lỗi xảy ra!', ephemeral: true }).catch(() => {});
    }
  }
});

// ====================== PREFIX COMMANDS ======================
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const prefix = '!';
  const content = message.content.toLowerCase().trim();
  const args = content.split(/\s+/);
  const commandName = args[0].replace(prefix, '');

  // --- LỆNH SPAWN THẺ (MỚI GỘP) ---
  if (commandName === 'spawn') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Chỉ Admin mới có quyền dùng lệnh này!');
    }
    message.channel.send('Đang triệu hồi thẻ khẩn cấp...');
    spawnCard(client, message.channelId);
    return; // Dừng xử lý để không chạy xuống các lệnh dưới
  }

  // 1. Lệnh Online / Stop (Tính năng Tag)
  if (commandName === 'online') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Bạn không có quyền!');
    const started = startTag(client, message.channel.id);
    if (started) {
        return message.channel.send("✅ Đã kích hoạt tag tự động mỗi 15-20 phút.");
    } else {
        return message.channel.send("⏳ Bot đang chạy tag tự động rồi.");
    }
  }

  if (commandName === 'stop') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Bạn không có quyền!');
    const stopped = stopTag();
    if (stopped) {
        return message.channel.send("🛑 Đã dừng tag tự động.");
    } else {
        return message.channel.send("Bot hiện không chạy.");
    }
  }

  // 2. Xử lý các lệnh đặc biệt của Voice Tracker
  if (content === prefix + 'time') {
      const info = client.voiceTracker.getTime(message.author.id);
      return message.reply(`Tháng ${info.month} bạn có **${info.minutes}** phút ở trong room voice.`);
  }

  if (content === prefix + 'runtime') {
      // THAY ID CỦA BẠN VÀO ĐÂY
      if (message.author.id !== '453518925997670411') return message.reply('Bạn không có quyền!');
      
      message.reply('Đang tiến hành check voice và cấp role toàn server...');
      return client.voiceTracker.check().then(() => {
          message.channel.send('✅ Đã hoàn tất cập nhật role và reset data!');
      });
  }

  // 3. Xử lý các lệnh prefix thông thường (pt, pta, checkpt, daily...)
  let cmdTarget = null;
  if (commandName === 'pt') cmdTarget = 'playtime';
  else if (['pta', 'checkpt', 'caprole', 'daily'].includes(commandName)) cmdTarget = commandName;

  if (cmdTarget) {
    const command = client.commands.get(cmdTarget);
    if (command) {
      try {
        await command.execute(message);
      } catch (error) {
        console.error('Lỗi command:', error);
        message.reply('Có lỗi xảy ra khi xử lý lệnh!');
      }
    }
  }
    
  // === AUTO CỘNG ĐIỂM KHI CHAT ===
  handleChatMessage(message.author.id);
});

// ====================== READY EVENT ======================
client.once('ready', () => {
  initPointsDB();
  console.log(`✅ Bot ${client.user.tag} đã online!`);

  // --- LẬP LỊCH SPAWN THẺ TỰ ĐỘNG (MỚI GỘP) ---
  cron.schedule('30 12,19,21 * * *', () => {
    spawnCard(client, CARD_CHANNEL_ID);
    console.log('--- Đã thực hiện spawn thẻ tự động theo lịch ---');
  }, { timezone: "Asia/Ho_Chi_Minh" });
});

// ====================== LOGIN ======================
// Sử dụng key trực tiếp như bạn yêu cầu
const DISCORD_TOKEN = "MTQ5NDU1MzcyOkeygiado9MaI"; 

client.login(DISCORD_TOKEN)
  .then(() => console.log("✅ Bot đã login thành công"))
  .catch(err => console.error("❌ Login thất bại:", err.message));
