const { EmbedBuilder } = require('discord.js');
const { claimDaily } = require('../utils/db');

module.exports = {
  data: {
    name: 'daily',
    description: 'Nhận điểm daily (reset 00:00 GMT+7)'
  },
  async execute(interaction) {
    const result = claimDaily(interaction.user.id);

    if (!result.success) {
      return interaction.reply({ content: result.message, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎁 Daily Point')
      .setDescription(`Bạn nhận được **${result.amount} điểm**!`);

    await interaction.reply({ embeds: [embed] });
  }
};