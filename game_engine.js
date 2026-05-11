const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// ===== KHU VỰC CHỈNH THỜI GIAN ĐỂ TEST =====
const REG_TIME = 5 * 60 * 1000;  // 5 phút đăng ký (Test thì chỉnh thành 10000 = 10 giây)
const DRAW_TIME = 25 * 60 * 1000; // 25 phút bốc thăm (Test thì chỉnh thành 20000 = 20 giây)
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 phút cập nhật embed 1 lần
// ===========================================

function getRandomCard() {
    const cards = JSON.parse(fs.readFileSync('./cards_data.json', 'utf8'));
    return cards[Math.floor(Math.random() * cards.length)];
}

function getInventory() {
    if (!fs.existsSync('./database.json')) return {};
    return JSON.parse(fs.readFileSync('./database.json', 'utf8'));
}

function saveInventory(data) {
    fs.writeFileSync('./database.json', JSON.stringify(data, null, 2));
}

async function spawnCard(client, channelId) {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    const card = getRandomCard();
    let registeredUsers = new Set();
    let drawUsers = new Set();

    // --- GIAI ĐOẠN 1: ĐĂNG KÝ ---
    const spawnEmbed = new EmbedBuilder()
        .setTitle(`**${card.name}**`)
        .setDescription(`${card.info}\n\n⏳ **Thời gian đăng ký:** 5 phút`)
        .setImage(card.image)
        .setColor('Blue');

    const regBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reg').setLabel('Đăng ký nhận thẻ').setStyle(ButtonStyle.Primary)
    );

    const message = await channel.send({ embeds: [spawnEmbed], components: [regBtn] });

    const regCollector = message.createMessageComponentCollector({ time: REG_TIME });

    regCollector.on('collect', i => {
        if (registeredUsers.has(i.user.id)) {
            return i.reply({ content: 'Bạn đã đăng ký rồi!', ephemeral: true });
        }
        registeredUsers.add(i.user.id);
        i.reply({ content: 'Đăng ký thành công!', ephemeral: true });
    });

    regCollector.on('end', async () => {
        if (registeredUsers.size === 0) {
            const failEmbed = EmbedBuilder.from(spawnEmbed).setColor('Grey').setFooter({ text: 'Thẻ đã biến mất (Không ai đăng ký)' });
            return message.edit({ embeds: [failEmbed], components: [] });
        }

        // --- GIAI ĐOẠN 2: BỐC THĂM ---
        let timeLeft = DRAW_TIME;
        
        const getDrawEmbed = (remaining) => {
            const minutes = Math.floor(remaining / 60000);
            return new EmbedBuilder()
                .setTitle(`**${card.name} - Đang bốc thăm**`)
                .setDescription(`Có ${registeredUsers.size} người tham gia.\n\n⏳ **Còn lại:** ${minutes} phút`)
                .setImage(card.image)
                .setColor('Yellow');
        };

        const drawBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('draw').setLabel('Bốc thăm theo lượt').setStyle(ButtonStyle.Success)
        );

        await message.edit({ embeds: [getDrawEmbed(timeLeft)], components: [drawBtn] });

        // Cập nhật Embed mỗi 10 phút (hoặc theo UPDATE_INTERVAL)
        const timer = setInterval(async () => {
            timeLeft -= UPDATE_INTERVAL;
            if (timeLeft > 0) {
                await message.edit({ embeds: [getDrawEmbed(timeLeft)] }).catch(() => clearInterval(timer));
            }
        }, UPDATE_INTERVAL);

        const drawCollector = message.createMessageComponentCollector({ time: DRAW_TIME });

        drawCollector.on('collect', i => {
            if (!registeredUsers.has(i.user.id)) {
                return i.reply({ content: 'Bạn chưa đăng ký ở bước trước!', ephemeral: true });
            }
            if (drawUsers.has(i.user.id)) {
                return i.reply({ content: 'Bạn đã đăng ký bốc thăm rồi!', ephemeral: true });
            }
            drawUsers.add(i.user.id);
            i.reply({ content: 'Đã xác nhận lượt bốc thăm!', ephemeral: true });
        });

        drawCollector.on('end', async () => {
            clearInterval(timer);
            const winChance = Math.random();
            const resultEmbed = EmbedBuilder.from(spawnEmbed);

            if (winChance <= 0.6 && drawUsers.size > 0) {
                const participants = Array.from(drawUsers);
                const winnerId = participants[Math.floor(Math.random() * participants.length)];
                
                let db = getInventory();
                if (!db[winnerId]) db[winnerId] = [];
                db[winnerId].push({ ...card, stars: 0 });
                saveInventory(db);

                resultEmbed.setColor('Green').setTitle(`**${card.name} - ĐÃ CÓ CHỦ**`)
                    .setDescription(`${card.info}\n\n🏆 **Người trúng:** <@${winnerId}>`);
            } else {
                resultEmbed.setColor('Red').setTitle(`**${card.name} - BIẾN MẤT**`)
                    .setDescription(`${card.info}\n\n💨 Thẻ không ai bốc (đã bay màu).`);
            }

            await message.edit({ embeds: [resultEmbed], components: [] });
        });
    });
}

module.exports = { spawnCard, getInventory, saveInventory };