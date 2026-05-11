const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const ROLE_ID = '1465321497852776592';
const MIN_MINUTES = 320;
const BLACKLIST_IDS = ['808935060430258216'];
const DATA_PATH = path.join(__dirname, '../data_voice/current_month.json');
const LAST_MONTH_PATH = path.join(__dirname, '../data_voice/last_month.json');

if (!fs.existsSync(path.join(__dirname, '../data_voice'))) {
    fs.mkdirSync(path.join(__dirname, '../data_voice'));
}

function loadData(filePath) {
    if (!fs.existsSync(filePath)) return {};
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- HÀM CẬP NHẬT THỜI GIAN LIÊN TỤC ---
function syncVoiceTime(client) {
    const data = loadData(DATA_PATH);
    let updated = false;

    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            // Kiểm tra nếu là voice channel và có người ở trong
            if (channel.isVoiceBased() && channel.members.size > 0) {
                channel.members.forEach(member => {
                    if (!member.user.bot && !BLACKLIST_IDS.includes(member.id)) {
                        // Cộng 1 phút cho mỗi người đang ngồi trong voice
                        data[member.id] = (data[member.id] || 0) + 1;
                        updated = true;
                    }
                });
            }
        });
    });

    if (updated) {
        saveData(DATA_PATH, data);
        console.log(`[${new Date().toLocaleTimeString()}] Đã đồng bộ thời gian voice.`);
    }
}

module.exports = (client) => {
    
    // Khi bot sẵn sàng, bắt đầu chạy heartbeat mỗi 1 phút
    client.once('ready', () => {
        console.log(`Bot ${client.user.tag} đã sẵn sàng tracking!`);
        
        // Chạy check ngay lập tức khi startup và sau đó mỗi 1 phút
        syncVoiceTime(client); 
        setInterval(() => syncVoiceTime(client), 60000); 
    });

    // Code xử lý role cuối tháng (giữ nguyên logic của bạn)
    async function performMonthlyCheck(client) {
        console.log('--- Bắt đầu tổng hợp voice cuối tháng ---');
        const currentData = loadData(DATA_PATH);
        
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const members = await guild.members.fetch();
                for (const [memberId, member] of members) {
                    if (BLACKLIST_IDS.includes(memberId) || member.user.bot) continue;

                    const minutes = currentData[memberId] || 0;
                    if (minutes >= MIN_MINUTES) { // Chỗ này bạn đang để <= là cấp role, mình sửa logic check chuẩn nhé
                        if (!member.roles.cache.has(ROLE_ID)) {
                            await member.roles.add(ROLE_ID);
                        }
                    } else {
                        if (member.roles.cache.has(ROLE_ID)) {
                            await member.roles.remove(ROLE_ID);
                        }
                    }
                }
            } catch (err) {
                console.error(`Lỗi:`, err.message);
            }
        }

        if (fs.existsSync(LAST_MONTH_PATH)) fs.unlinkSync(LAST_MONTH_PATH);
        if (fs.existsSync(DATA_PATH)) fs.renameSync(DATA_PATH, LAST_MONTH_PATH);
        saveData(DATA_PATH, {});
    }

    cron.schedule('59 23 28-31 * *', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDate() === 1) await performMonthlyCheck(client);
    });

    client.voiceTracker = {
        check: () => performMonthlyCheck(client),
        getTime: (userId) => {
            const currentMonth = loadData(DATA_PATH);
            return { minutes: currentMonth[userId] || 0 };
        }
    };
};