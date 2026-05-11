const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { getInventory, saveInventory, spawnCard } = require('./game_engine');

module.exports = {
    data: [
        new SlashCommandBuilder().setName('tuido').setDescription('Xem túi đồ của bạn'),
        new SlashCommandBuilder().setName('show').setDescription('Show thẻ cho mọi người xem')
            .addIntegerOption(opt => opt.setName('id').setDescription('Số thứ tự thẻ trong túi').setRequired(true)),
        new SlashCommandBuilder().setName('nangcapthe').setDescription('Nâng cấp sao cho thẻ'),
        new SlashCommandBuilder().setName('admin_spawn').setDescription('Lệnh ẩn để test spawn thẻ (Admin only)')
    ].map(cmd => cmd.toJSON()),

    async execute(interaction, client) {
        const { commandName, user, options } = interaction;
        let db = getInventory();

        if (commandName === 'tuido') {
            const items = db[user.id] || [];
            if (items.length === 0) return interaction.reply('Túi đồ của bạn đang trống!');

            const embed = new EmbedBuilder()
                .setTitle(`Túi đồ của ${user.username}`)
                .setDescription(items.map((item, index) => `${index + 1}. **${item.name}** (${item.stars}⭐)`).join('\n'))
                .setColor('Green');

            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'show') {
            const idx = options.getInteger('id') - 1;
            const items = db[user.id] || [];
            if (!items[idx]) return interaction.reply('Không tìm thấy thẻ!');

            const item = items[idx];
            
            // Tạo chuỗi hiển thị sao (ví dụ: ⭐⭐⭐)
            // Nếu sao quá nhiều (ví dụ > 10) thì hiển thị số để tránh làm rối embed
            const starDisplay = item.stars > 0 ? `**Cấp độ:** ${'⭐'.repeat(Math.min(item.stars, 10))}${item.stars > 10 ? ` (${item.stars}⭐)` : ''}` : '**Cấp độ:** 0⭐';

            const embed = new EmbedBuilder()
                .setTitle(`**${item.name}**`)
                .setDescription(`${starDisplay}\n\n**Chủ sở hữu:** <@${user.id}>\n\n**Thông tin:**\n${item.info}`)
                .setImage(item.image)
                .setColor('Blue')
                .setTimestamp(); // Thêm thời gian hiển thị

            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'nangcapthe') {
            const inventory = db[user.id] || [];
            
            // Lọc danh sách thẻ: Chỉ hiện những thẻ có ít nhất 1 thẻ khác trùng tên
            const upgradeableOptions = inventory.filter(card => 
                inventory.filter(c => c.name === card.name).length >= 2
            );

            if (upgradeableOptions.length < 2) {
                return interaction.reply('Bạn không có đủ thẻ trùng tên để thực hiện nâng cấp!');
            }

            // Tạo Select Menu cho phép chọn đúng 2 thẻ
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_two_cards')
                .setPlaceholder('Tích chọn đúng 2 thẻ cùng tên để nâng cấp...')
                .setMinValues(2) // Bắt buộc chọn 2
                .setMaxValues(2) // Tối đa chọn 2
                .addOptions(
                    // Hiển thị tối đa 25 thẻ gần nhất trong túi đồ có khả năng nâng cấp
                    upgradeableOptions.slice(0, 25).map((item, index) => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${item.name} (${item.stars}⭐)`)
                            .setDescription(`Vị trí túi: ${inventory.indexOf(item) + 1}`)
                            .setValue(inventory.indexOf(item).toString()) // Gửi index của thẻ trong túi
                    )
                );

            const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
            const upgradeEmbed = new EmbedBuilder()
                .setTitle('Hệ thống nâng cấp thẻ')
                .setDescription('Hãy tích chọn **2 thẻ cùng tên** từ danh sách bên dưới.\n- Thẻ nhiều sao hơn sẽ tự động làm **Thẻ chính**.\n- Thẻ ít sao hơn sẽ làm **Nguyên liệu**.')
                .setColor('Purple');

            const msg = await interaction.reply({ embeds: [upgradeEmbed], components: [rowSelect], fetchReply: true });

            const collector = msg.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== user.id) return i.reply({ content: 'Không phải lượt của bạn!', flags: [64] });

                if (i.isStringSelectMenu()) {
                    const selectedIndices = i.values.map(Number);
                    const card1 = inventory[selectedIndices[0]];
                    const card2 = inventory[selectedIndices[1]];

                    // Kiểm tra xem 2 thẻ có cùng tên không
                    if (card1.name !== card2.name) {
                        return i.reply({ content: 'Lỗi: Bạn phải chọn 2 thẻ **cùng tên**!', flags: [64] });
                    }

                    // Phân loại thẻ chính và thẻ phôi
                    const baseCard = card1.stars >= card2.stars ? card1 : card2;
                    const fodderCard = card1.stars >= card2.stars ? card2 : card1;
                    
                    // Chỉ định lại index thực tế trong mảng gốc
                    const baseIdx = inventory.indexOf(baseCard);
                    const fodderIdx = inventory.indexOf(fodderCard);

                    let rate = 0.5;
                    if (baseCard.stars >= 5) rate = 0.25;
                    if (baseCard.stars >= 10) rate = 0.05;
                    if (baseCard.stars >= 20) rate = 0.03;

                    const rowBtns = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirm_${baseIdx}_${fodderIdx}`)
                            .setLabel(`Nâng cấp (${Math.floor(rate * 100)}%)`)
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('cancel').setLabel('Hủy').setStyle(ButtonStyle.Secondary)
                    );

                    await i.update({ 
                        content: `Đã chọn: **${baseCard.name}**\n🔹 Thẻ chính: **${baseCard.stars}⭐**\n🔸 Nguyên liệu: **${fodderCard.stars}⭐**`,
                        components: [rowBtns],
                        embeds: []
                    });
                }

                if (i.customId.startsWith('confirm_')) {
                    const [, bIdx, fIdx] = i.customId.split('_').map(Number);
                    const currentInv = getInventory()[user.id];
                    
                    const baseCard = currentInv[bIdx];
                    const fodderCard = currentInv[fIdx];

                    let rate = 0.5;
                    if (baseCard.stars >= 5) rate = 0.25;
                    if (baseCard.stars >= 10) rate = 0.05;
                    if (baseCard.stars >= 20) rate = 0.03;

                    if (Math.random() < rate) {
                        currentInv[bIdx].stars += 1;
                        const newStars = currentInv[bIdx].stars;
                        currentInv.splice(fIdx, 1); // Xóa thẻ phôi
                        await i.update({ content: `✅ **Thành công!** Thẻ đã lên **${newStars}⭐**`, components: [] });
                    } else {
                        currentInv.splice(fIdx, 1); // Xóa thẻ phôi kể cả khi hụt
                        await i.update({ content: `❌ **Thất bại!** Mất thẻ nguyên liệu, thẻ chính giữ nguyên **${baseCard.stars}⭐**`, components: [] });
                    }
                    
                    db[user.id] = currentInv;
                    saveInventory(db);
                }

                if (i.customId === 'cancel') await i.update({ content: 'Đã hủy.', components: [], embeds: [] });
            });
        }
    }
};