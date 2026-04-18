require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { initDB, handleChatMessage } = require('./utils/db');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Slash Commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Lỗi slash command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: 'Có lỗi xảy ra khi xử lý lệnh!', 
        ephemeral: true 
      }).catch(() => {});
    }
  }
});

// Prefix Commands (!pt, !pta)
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const prefix = '!';
  const content = message.content.toLowerCase().trim();

  let cmdName = null;
  if (content === prefix + 'pt' || content.startsWith(prefix + 'pt ')) cmdName = 'playtime';
  if (content === prefix + 'pta') cmdName = 'pta';

  if (cmdName) {
    const command = client.commands.get(cmdName);
    if (command) {
      try {
        await command.execute(message);
      } catch (error) {
        console.error('Lỗi prefix command:', error);
        message.reply('Có lỗi xảy ra!').catch(() => {});
      }
    }
  }
    // === AUTO POINT CHAT (thêm ngay đây) ===
  handleChatMessage(message.author.id);
});

client.once('ready', () => {
  initDB();
  console.log(`✅ Bot ${client.user.tag} đã online!`);
});

// === TEMPORARY HARD CODE TOKEN (chỉ dùng để test) ===
const DISCORD_TOKEN = "MTQ5NDU1MzcyOTg0NzAwMTE3OQ.GUtt6Q.o8";   // ← DÁN ĐẦY ĐỦ TOKEN BOT VÀO ĐÂY

client.login(DISCORD_TOKEN)
  .then(() => console.log("✅ Bot đã login thành công bằng hardcode token"))
  .catch(err => console.error("❌ Login thất bại:", err.message));
