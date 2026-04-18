const { EmbedBuilder } = require('discord.js');
const { getTopPoints } = require('../utils/db');

module.exports = {
  data: {
    name: 'top',
    description: 'Xem top 5 người có nhiều điểm nhất'
  },
  async execute(interaction) {
    const top = getTopPoints(5);

    if (top.length === 0) {
      return interaction.reply('Chưa có ai có điểm nào!');
    }

    // Lấy displayName
    const userIds = top.map(p => p.discord_id);
    let members = new Map();
    try {
      const fetched = await interaction.guild.members.fetch({ user: userIds });
      members = fetched;
    } catch (e) {}

    let listText = '';
    top.forEach((player, index) => {
      const member = members.get(player.discord_id);
      const name = member ? member.displayName : 'Unknown';
      listText += `${index + 1}. ${name} - **${player.points} điểm**\n`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🏆 Top 5 người chơi điểm cao nhất')
      .setDescription(listText);

    await interaction.reply({ embeds: [embed] });
  }
};