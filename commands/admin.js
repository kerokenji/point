const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { setSetting, addPoints, setUserPoints, getUserPoints } = require('../utils/db');

module.exports = {
  data: {
    name: 'admin',
    description: 'Lệnh admin quản lý điểm (chỉ admin dùng được)',
    options: [
      {
        name: 'set-cooldown',
        description: 'Thay đổi cooldown chat (giây)',
        type: 1,
        options: [
          { name: 'seconds', description: 'Số giây', type: 4, required: true }
        ]
      },
      {
        name: 'set-chat-points',
        description: 'Thay đổi số điểm cộng mỗi lần chat',
        type: 1,
        options: [
          { name: 'amount', description: 'Số điểm', type: 4, required: true }
        ]
      },
      {
        name: 'give-points',
        description: 'Tặng điểm cho người chơi',
        type: 1,
        options: [
          { name: 'user', description: 'Người nhận', type: 6, required: true },
          { name: 'amount', description: 'Số điểm tặng', type: 4, required: true }
        ]
      },
      {
        name: 'remove-points',                    // ← Đổi tên cho rõ ràng
        description: 'Xóa (trừ) một số điểm của người chơi',
        type: 1,
        options: [
          { name: 'user', description: 'Người chơi', type: 6, required: true },
          { name: 'amount', description: 'Số điểm muốn trừ', type: 4, required: true }
        ]
      }
    ]
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Chỉ admin mới dùng được lệnh này!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'set-cooldown') {
      const sec = interaction.options.getInteger('seconds');
      setSetting('chat_cooldown', sec);
      return interaction.reply(`✅ Đã set cooldown chat thành **${sec} giây**.`);
    }

    if (sub === 'set-chat-points') {
      const amt = interaction.options.getInteger('amount');
      setSetting('chat_points', amt);
      return interaction.reply(`✅ Đã set điểm chat mỗi lần thành **${amt} điểm**.`);
    }

    if (sub === 'give-points') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      if (amt <= 0) return interaction.reply('❌ Số điểm phải lớn hơn 0.');
      
      addPoints(user.id, amt);
      return interaction.reply(`✅ Đã tặng **${amt} điểm** cho ${user.username}.`);
    }

    if (sub === 'remove-points') {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) {
        return interaction.reply('❌ Số điểm muốn trừ phải lớn hơn 0.');
      }

      const currentPoints = getUserPoints(user.id);
      const newPoints = Math.max(0, currentPoints - amount);   // Không cho điểm âm

      setUserPoints(user.id, newPoints);

      return interaction.reply(
        `✅ Đã trừ **${amount} điểm** của ${user.username}.\n` +
        `Điểm trước: ${currentPoints} → Điểm hiện tại: **${newPoints}**`
      );
    }
  }
};