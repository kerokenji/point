require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

// Prefix commands
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const prefix = '!';

  if (message.content.startsWith(prefix + 'pt') && !message.content.startsWith(prefix + 'pta')) {
    const cmd = client.commands.get('playtime');
    if (cmd) await cmd.execute({ ...message, member: message.member, user: message.author, guild: message.guild, reply: msg => message.reply(msg) });
  }

  if (message.content === prefix + 'pta' || message.content === prefix + 'pt a') {
    const cmd = client.commands.get('pta');
    if (cmd) await cmd.execute({ ...message, member: message.member, user: message.author, guild: message.guild, reply: msg => message.reply(msg) });
  }
});

// Slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Có lỗi xảy ra!', ephemeral: true });
    }
  }
});

client.once('ready', () => {
  console.log(`✅ Bot ${client.user.tag} đã online!`);
});

client.login(process.env.DISCORD_TOKEN);
