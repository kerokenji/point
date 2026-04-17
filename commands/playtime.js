const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getAllPlaytime, getLastUpdateTime } = require('../utils/db');
const { createDiscordToAccountMap } = require('../utils/mapping');
const { formatPlaytime } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playtime')
    .setDescription('Xem thời gian chơi của bạn hoặc người khác')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Người muốn kiểm tra (để trống = kiểm tra bản thân)')
        .setRequired(false)
    ),

  async execute(ctx) {
    const isInteraction = !!ctx.isChatInputCommand;

    // Lấy người dùng cần check
    let targetUser;
    if (isInteraction) {
      targetUser = ctx.options.getUser('user') || ctx.user;
    } else {
      // Prefix command thì mặc định là người dùng lệnh
      targetUser = ctx.author;
    }

    const discordId = targetUser.id;
    const displayName = targetUser.displayName || targetUser.username || 'Unknown';

    const discordToAccount = createDiscordToAccountMap();
    const accountId = discordToAccount[discordId];

    const rows = getAllPlaytime();
    let minutes = 0;

    if (accountId) {
      const dbMap = new Map(
        rows.map(row => [row.steamid.split(':').pop(), row.minutes])
      );
      minutes = dbMap.get(accountId) || 0;
    }

    const { hours } = formatPlaytime(minutes);
    const updateTime = getLastUpdateTime();

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('Thời gian chơi')
      .setDescription(
        `**Người chơi:** ${displayName}\n` +
        `**Giờ chơi:** ${hours} giờ (${minutes} phút)`
      )
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