const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { SQ3_PATH, MAPPING_PATH, PLAYTIME_ROLES, VN_TZ } = require('./config');

function extractZ(steam_id) {
    if (steam_id.includes(':')) {
        const parts = steam_id.split(':');
        if (parts.length === 3) return parts[2];
    }
    return steam_id;
}

function loadMapping() {
    if (!fs.existsSync(MAPPING_PATH)) {
        console.log("Không tìm thấy steam_discord_mapping.json");
        return {};
    }
    const raw = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
    const map = {};
    Object.entries(raw).forEach(([k, v]) => {
        map[extractZ(k)] = parseInt(v);
    });
    return map;
}

async function getPlaytimeDb() {
    if (!fs.existsSync(SQ3_PATH)) {
        console.log("Không tìm thấy sourcemod-local.sq3");
        return {};
    }
    return new Promise((resolve) => {
        const conn = new sqlite3.Database(SQ3_PATH, sqlite3.OPEN_READONLY);
        conn.all("SELECT steamid, minutes FROM playtime", (err, rows) => {
            if (err) {
                console.log("Lỗi đọc DB:", err);
                conn.close();
                resolve({});
                return;
            }
            const data = {};
            rows.forEach(row => data[extractZ(row.steamid)] = row.minutes);
            conn.close();
            resolve(data);
        });
    });
}

async function getRoleChanges(guild) {
    const mapping = loadMapping();
    const playtimeDb = await getPlaytimeDb();
    const changes = [];

    for (const [z, discordId] of Object.entries(mapping)) {
        const minutes = playtimeDb[z] || 0;
        const hours = Math.round(minutes / 60 * 10) / 10;

        const member = guild.members.cache.get(discordId);
        if (!member) continue;

        const currentRole = member.roles.cache.find(r => PLAYTIME_ROLES.some(pr => pr.role_id === r.id));
        let newRole = null;
        for (let i = PLAYTIME_ROLES.length - 1; i >= 0; i--) {
            if (minutes >= PLAYTIME_ROLES[i].min_min) {
                newRole = guild.roles.cache.get(PLAYTIME_ROLES[i].role_id);
                break;
            }
        }

        if (newRole && (!currentRole || newRole.id !== currentRole.id)) {
            changes.push({ member, z, hours, currentRole, newRole });
        }
    }
    return changes;
}

function getLastUpdate() {
    if (!fs.existsSync(SQ3_PATH)) return "Không tìm thấy file";
    const stats = fs.statSync(SQ3_PATH);
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: VN_TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(stats.mtime);
}

module.exports = { extractZ, loadMapping, getPlaytimeDb, getRoleChanges, getLastUpdate };
