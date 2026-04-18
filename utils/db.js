const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../points.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
  }
  return db;
}

// === PHẦN CŨ (playtime) - giữ nguyên ===
function getLastUpdateTime() {
  const stats = fs.statSync(DB_PATH);
  const date = stats.mtime;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `(${day}/${month}/${year} ${hour}:${minute})`;
}

function getAllPlaytime() {
  const db = getDB();
  const stmt = db.prepare('SELECT steamid, minutes FROM playtime');
  return stmt.all();
}

// === PHẦN MỚI: HỆ THỐNG ĐIỂM CHAT ===
function initDB() {
  const dbInstance = getDB();
  
  // Tạo bảng points
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS points (
      discord_id TEXT PRIMARY KEY,
      points INTEGER DEFAULT 0,
      last_chat INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT 0
    );
  `);

  // Tạo bảng settings
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    );
  `);

  // Default values
  const insertDefault = dbInstance.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertDefault.run('chat_cooldown', 15);
  insertDefault.run('chat_points', 2);

  console.log('✅ Hệ thống điểm đã khởi tạo với file points.db');
}

function getSetting(key) {
  const dbInstance = getDB();
  const row = dbInstance.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const dbInstance = getDB();
  dbInstance.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function ensureUser(discordId) {
  const dbInstance = getDB();
  dbInstance.prepare(`
    INSERT OR IGNORE INTO points (discord_id, points, last_chat, last_daily)
    VALUES (?, 0, 0, 0)
  `).run(discordId);
}

function getUserPoints(discordId) {
  const dbInstance = getDB();
  const row = dbInstance.prepare('SELECT points FROM points WHERE discord_id = ?').get(discordId);
  return row ? row.points : 0;
}

function addPoints(discordId, amount) {
  ensureUser(discordId);
  const dbInstance = getDB();
  dbInstance.prepare('UPDATE points SET points = points + ? WHERE discord_id = ?').run(amount, discordId);
}

function setUserPoints(discordId, newPoints) {
  ensureUser(discordId);
  const dbInstance = getDB();
  dbInstance.prepare('UPDATE points SET points = ? WHERE discord_id = ?').run(newPoints, discordId);
}

function getTopPoints(limit = 5) {
  const dbInstance = getDB();
  return dbInstance.prepare(`
    SELECT discord_id, points 
    FROM points 
    ORDER BY points DESC 
    LIMIT ?
  `).all(limit);
}

// Auto reward chat points
function handleChatMessage(discordId) {
  const cooldownSec = getSetting('chat_cooldown') || 15;
  const pointsPer = getSetting('chat_points') || 2;
  const now = Date.now();

  const dbInstance = getDB();
  let row = dbInstance.prepare('SELECT last_chat, points FROM points WHERE discord_id = ?').get(discordId);

  if (!row) {
    ensureUser(discordId);
    row = { last_chat: 0, points: 0 };
  }

  if (now - row.last_chat > cooldownSec * 1000) {
    const newPoints = row.points + pointsPer;
    dbInstance.prepare('UPDATE points SET points = ?, last_chat = ? WHERE discord_id = ?')
      .run(newPoints, now, discordId);
  }
}

// Daily reward
const DAILY_REWARDS = [
  { points: 11, weight: 85 },
  { points: 90, weight: 7 },
  { points: 150, weight: 4 },
  { points: 500, weight: 3 },
  { points: 1000, weight: 1 }
];

function getRandomDailyPoints() {
  let total = DAILY_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * total;
  for (let reward of DAILY_REWARDS) {
    if (rand < reward.weight) return reward.points;
    rand -= reward.weight;
  }
  return 11; // fallback
}

function canClaimDaily(discordId) {
  const dbInstance = getDB();
  const row = dbInstance.prepare('SELECT last_daily FROM points WHERE discord_id = ?').get(discordId);
  if (!row || !row.last_daily) return true;

  const last = row.last_daily;
  const offset = 7 * 60 * 60 * 1000; // GMT+7
  const nowVN = new Date(Date.now() + offset);
  const lastVN = new Date(last + offset);

  const nowY = nowVN.getUTCFullYear();
  const nowM = nowVN.getUTCMonth();
  const nowD = nowVN.getUTCDate();
  const lastY = lastVN.getUTCFullYear();
  const lastM = lastVN.getUTCMonth();
  const lastD = lastVN.getUTCDate();

  return nowY > lastY || 
         (nowY === lastY && nowM > lastM) || 
         (nowY === lastY && nowM === lastM && nowD > lastD);
}

function claimDaily(discordId) {
  if (!canClaimDaily(discordId)) {
    return { success: false, message: 'Bạn đã nhận điểm daily hôm nay rồi!' };
  }

  const amount = getRandomDailyPoints();
  addPoints(discordId, amount);

  const dbInstance = getDB();
  dbInstance.prepare('UPDATE points SET last_daily = ? WHERE discord_id = ?')
    .run(Date.now(), discordId);

  return { success: true, amount };
}

module.exports = {
  // cũ
  getAllPlaytime,
  getLastUpdateTime,
  // mới
  initDB,
  handleChatMessage,
  getUserPoints,
  addPoints,
  setUserPoints,
  getTopPoints,
  getSetting,
  setSetting,
  canClaimDaily,
  claimDaily,
  getRandomDailyPoints
};