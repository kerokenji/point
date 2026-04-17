const { EmbedBuilder } = require('discord.js');
const { getAllPlaytime, getLastUpdateTime } = require('../utils/db');
const { createDiscordToAccountMap } = require('../utils/mapping');
const { formatPlaytime } = require('../utils/helpers');

module.exports = {
  data: {
    name: 'pta',
    description: 'Xem top 15 người chơi có thời gian lâu nhất',
  },
  async execute(interaction) {
    const rows = getAllPlaytime();
    const discordToAccount = createDiscordToAccountMap();

    // Build list from mapped players only
    const playerList = [];
    const dbMap = new Map();
    rows.forEach(row => {
      const acc = row.steamid.split(':').pop();
      dbMap.set(acc, row.minutes);
    });

    for (const [discordId, accountId] of Object.entries(discordToAccount)) {
      const minutes = dbMap.get(accountId) || 0;
      playerList.push({ discordId, minutes });
    }

    // Sort desc
    playerList.sort((a, b) => b.minutes - a.minutes);

    // Take top 15
    const top15 = playerList.slice(0, 15);

    // Fetch members to get displayName
    const userIds = top15.map(p => p.discordId);
    let members = new Map();
    if (userIds.length > 0) {
      try {
        const fetched = await interaction.guild.members.fetch({ user: userIds });
        members = fetched;
      } catch (e) {}
    }

    let listText = '';
    top15.forEach((player, index) => {
      const member = members.get(player.discordId);
      const name = member ? member.displayName : 'Unknown';
      const { hours } = formatPlaytime(player.minutes);
      listText += `${index + 1}. ${name} - \( {hours} giờ ( \){player.minutes} phút)\n`;
    });

    const updateTime = getLastUpdateTime();

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Danh sách giờ chơi toàn server (cao → thấp)')
      .setDescription(listText || 'Không có dữ liệu')
      .setFooter({ text: `Cập nhật lần cuối: ${updateTime}` });

    await interaction.reply({ embeds: [embed] });
  },
};
