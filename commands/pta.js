const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getAllPlaytime, getLastUpdateTime } = require('../utils/db');
const { createDiscordToAccountMap } = require('../utils/mapping');
const { formatPlaytime } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pta')
    .setDescription('Xem top 15 người chơi có thời gian lâu nhất (Chỉ Admin)'),

  async execute(ctx) {
    const isInteraction = !!ctx.isChatInputCommand;

    // ====================== KIỂM TRA QUYỀN ADMIN ======================
    let hasPermission = false;

    if (isInteraction) {
      // Với slash command
      hasPermission = ctx.member.permissions.has(PermissionsBitField.Flags.Administrator);
    } else {
      // Với prefix command (!pta)
      hasPermission = ctx.member.permissions.has(PermissionsBitField.Flags.Administrator);
    }

    if (!hasPermission) {
      const noPermEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription('⛔ **Bạn không có quyền sử dụng lệnh này.**\nChỉ **Admin** mới được dùng lệnh `/pta`.');
      
      try {
        if (isInteraction) {
          await ctx.reply({ embeds: [noPermEmbed], ephemeral: true });
        } else {
          await ctx.reply({ embeds: [noPermEmbed] });
        }
      } catch (err) {
        console.error('Reply error:', err.message);
      }
      return; // Dừng lại, không chạy tiếp
    }
    // =================================================================

    // ====================== PHẦN CODE XỬ LÝ TOP 15 ======================
    const rows = getAllPlaytime();
    const discordToAccount = createDiscordToAccountMap();

    const dbMap = new Map();
    rows.forEach(row => {
      const acc = row.steamid.split(':').pop();
      dbMap.set(acc, parseInt(row.minutes) || 0);
    });

    const playerList = [];
    for (const [discordId, accountId] of Object.entries(discordToAccount)) {
      const minutes = dbMap.get(accountId) || 0;
      if (minutes > 0) {
        playerList.push({ discordId, minutes });
      }
    }

    playerList.sort((a, b) => b.minutes - a.minutes);
    const top15 = playerList.slice(0, 15);

    const userIds = top15.map(p => p.discordId);
    let members = new Map();
    if (userIds.length > 0 && ctx.guild) {
      try {
        const fetched = await ctx.guild.members.fetch({ user: userIds, force: true });
        members = fetched;
      } catch (e) {
        console.error('Lỗi fetch members:', e.message);
      }
    }

    let listText = '';
    top15.forEach((player, index) => {
      const member = members.get(player.discordId);
      const name = member ? member.displayName : 'Unknown';
      const { hours } = formatPlaytime(player.minutes);
      listText += `${index + 1}. ${name} - ${hours} giờ (${player.minutes} phút)\n`;
    });

    const updateTime = getLastUpdateTime();

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Danh sách giờ chơi toàn server (cao → thấp)')
      .setDescription(listText || 'Chưa có dữ liệu chơi nào.')
      .setFooter({ text: `Cập nhật lần cuối: ${updateTime}` })
      .setTimestamp();

    try {
      if (isInteraction) {
        await ctx.reply({ embeds: [embed] });
      } else {
        await ctx.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Reply error:', err.message);
    }
  },
};
