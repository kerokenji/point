const { EmbedBuilder } = require('discord.js');
const { getUserPoints } = require('../utils/db');

module.exports = {
  data: {
    name: 'point',
    description: 'Xem điểm của bạn hoặc người khác',
    options: [
      {
        name: 'user',
        description: 'Người dùng cần xem (tùy chọn)',
        type: 6, // USER
        required: false
      }
    ]
  },
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const points = getUserPoints(target.id);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('📊 Điểm của bạn')
      .setDescription(`**Người chơi:** ${target.username}\n**Điểm:** ${points}`);

    await interaction.reply({ embeds: [embed] });
  }
};