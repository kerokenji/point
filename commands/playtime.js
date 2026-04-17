const { EmbedBuilder } = require('discord.js');
const { getAllPlaytime, getLastUpdateTime } = require('../utils/db');
const { createDiscordToAccountMap } = require('../utils/mapping');
const { formatPlaytime } = require('../utils/helpers');

module.exports = {
  data: {
    name: 'playtime',
    description: 'Xem thời gian chơi của bạn',
  },
  async execute(interaction) {
    const discordId = interaction.user.id;
    const discordToAccount = createDiscordToAccountMap();
    const accountId = discordToAccount[discordId];

    const rows = getAllPlaytime();
    let minutes = 0;

    if (accountId) {
      const dbMap = new Map();
      rows.forEach(row => {
        const acc = row.steamid.split(':').pop();
        dbMap.set(acc, row.minutes);
      });
      minutes = dbMap.get(accountId) || 0;
    }

    const { hours } = formatPlaytime(minutes);
    const updateTime = getLastUpdateTime();

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setDescription(
        `**Người chơi:** ${interaction.member.displayName}\n` +
        `**Giờ chơi:** \( {hours} giờ ( \){minutes} phút)\n` +
        `**Cập nhật lần cuối:** ${updateTime}`
      );

    await interaction.reply({ embeds: [embed] });
  },
};
