const { PermissionFlagsBits } = require('discord.js');

// --- CẤU HÌNH ID ---
const CONFIG = {
    TEXT_CHANNEL_ID: '1502638561114198118',
    VOICE_CHANNEL_ID: '1389473241290117183',
    TAG_ROLE_ID: '1501910216948846682',
    TRIGGER_USER_ID: '453518925997670411',
    STATIC_BLACKLIST: ['808935060430258216', '453518925997670411']
};

let tagTimeout = null;
let adminChannelId = null;

async function updateTagRoles(guild, voiceChannel) {
    const role = guild.roles.cache.get(CONFIG.TAG_ROLE_ID);
    if (!role) return false;

    const currentVoiceIds = voiceChannel.members.map(m => m.id);
    const blacklist = new Set([...CONFIG.STATIC_BLACKLIST, ...currentVoiceIds]);

    // Fetch toàn bộ thành viên để đảm bảo cache chính xác
    const members = await guild.members.fetch();

    for (const [id, member] of members) {
        if (member.user.bot) continue;

        if (blacklist.has(id)) {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role).catch(() => {});
            }
        } else {
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
            }
        }
    }
    return true;
}

async function runTagLoop(client) {
    const textChannel = client.channels.cache.get(CONFIG.TEXT_CHANNEL_ID);
    const voiceChannel = client.channels.cache.get(CONFIG.VOICE_CHANNEL_ID);

    if (!textChannel || !voiceChannel) return;

    const triggerMember = voiceChannel.members.get(CONFIG.TRIGGER_USER_ID);

    // Kiểm tra nếu Admin rời Voice
    if (!triggerMember) {
        if (adminChannelId) {
            const adminChan = client.channels.cache.get(adminChannelId);
            if (adminChan) adminChan.send("🛑 Dừng tag tự động vì Admin đã rời voice.");
        }
        stopTag();
        return;
    }

    const success = await updateTagRoles(textChannel.guild, voiceChannel);
    if (success) {
        const role = textChannel.guild.roles.cache.get(CONFIG.TAG_ROLE_ID);
        await textChannel.send(`📢 <@&${role.id}> vào chơi L4D2 đi nào! 🧟‍♂️`);
    }

    // Thiết lập thời gian chờ ngẫu nhiên từ 15 đến 20 phút
    const waitMinutes = Math.floor(Math.random() * (20 - 15 + 1)) + 15;
    tagTimeout = setTimeout(() => runTagLoop(client), waitMinutes * 60 * 1000);
}

function startTag(client, ctxChannelId) {
    adminChannelId = ctxChannelId;
    if (tagTimeout) return false;
    runTagLoop(client);
    return true;
}

function stopTag() {
    if (tagTimeout) {
        clearTimeout(tagTimeout);
        tagTimeout = null;
        return true;
    }
    return false;
}

module.exports = { startTag, stopTag };