const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bot.db');

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function initDb() {
    await run(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value INTEGER)`);
    await run(`CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, points INTEGER DEFAULT 0)`);
    await run(`CREATE TABLE IF NOT EXISTS cooldowns (user_id INTEGER PRIMARY KEY, last_time REAL)`);
    await run(`CREATE TABLE IF NOT EXISTS dailies (user_id INTEGER PRIMARY KEY, last_date TEXT)`);
    await run(`CREATE TABLE IF NOT EXISTS owned_roles (user_id INTEGER, role_id INTEGER, expire REAL, is_custom INTEGER, PRIMARY KEY(user_id, role_id))`);
    await run(`CREATE TABLE IF NOT EXISTS buyable_roles (role_id INTEGER PRIMARY KEY)`);
    await run(`CREATE TABLE IF NOT EXISTS active_gift (id INTEGER PRIMARY KEY DEFAULT 1, reward_config TEXT, expire REAL)`);
    await run(`CREATE TABLE IF NOT EXISTS claimed_gifts (user_id INTEGER PRIMARY KEY)`);

    const count = await get("SELECT COUNT(*) as c FROM config");
    if (count.c === 0) {
        await run("INSERT INTO config VALUES ('points_per_msg', 2), ('cooldown_sec', 20)");
    }
}

async function getConfig(key, defaultVal = 0) {
    const row = await get("SELECT value FROM config WHERE key = ?", [key]);
    return row ? row.value : defaultVal;
}

module.exports = { initDb, getConfig, run, get, all };
