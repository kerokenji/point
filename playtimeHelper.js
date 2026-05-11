const fs = require('fs');
const path = require('path'); // Module quan trọng để xử lý đường dẫn
const Database = require('better-sqlite3');
const config = require('./config.json');

module.exports = async function getRoleChanges(guild) {
    // Tự động xác định đường dẫn tuyệt đối đến các file nằm cùng thư mục với playtimeHelper.js
    const dbPath = path.resolve(__dirname, config.SQ3_PATH);
    const mappingPath = path.resolve(__dirname, config.MAPPING_PATH);

    // Kiểm tra file có tồn tại không trước khi mở
    if (!fs.existsSync(dbPath)) {
        console.error(`❌ Không tìm thấy database tại: ${dbPath}`);
        return [];
    }

    if (!fs.existsSync(mappingPath)) {
        console.error(`❌ Không tìm thấy file mapping tại: ${mappingPath}`);
        return [];
    }

    try {
        const db = new Database(dbPath);
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        // Chuẩn hóa mapping để tìm kiếm nhanh hơn (lấy số cuối SteamID làm key)
        const normalizedMapping = {};
        for (const [fullSteamID, discordId] of Object.entries(mapping)) {
            const steamZ = fullSteamID.split(':').pop().trim();
            normalizedMapping[steamZ] = discordId;
        }

        const rows = db.prepare("SELECT steamid, minutes FROM playtime").all();
        db.close();

        const changes = [];
        const roleIds = config.PLAYTIME_ROLES.map(r => r.role_id);

        // Fetch toàn bộ member để tránh lỗi cache của discord.js
        await guild.members.fetch();

        for (const row of rows) {
            const steamZ = row.steamid.split(':').pop().trim();
            const discordId = normalizedMapping[steamZ];

            if (!discordId) continue;

            const member = guild.members.cache.get(discordId);
            if (!member) continue;

            const minutes = row.minutes;
            const eligibleRole = [...config.PLAYTIME_ROLES]
                .reverse()
                .find(r => minutes >= r.min_min);

            const currentRole = member.roles.cache.find(r => roleIds.includes(r.id));

            if (eligibleRole) {
                if (!currentRole || currentRole.id !== eligibleRole.role_id) {
                    changes.push({
                        member,
                        hours: (minutes / 60).toFixed(1),
                        oldRole: currentRole,
                        newRole: guild.roles.cache.get(eligibleRole.role_id)
                    });
                }
            }
        }
        return changes;

    } catch (error) {
        console.error("❌ Lỗi khi xử lý dữ liệu playtime:", error);
        return [];
    }
};