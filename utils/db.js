const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../sourcemod-local.sq3');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
  }
  return db;
}

function getLastUpdateTime() {
  const stats = fs.statSync(DB_PATH);
  const date = stats.mtime;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `\( {day}/ \){month}/${year} \( {hour}: \){minute}`;
}

function getAllPlaytime() {
  const db = getDB();
  const stmt = db.prepare('SELECT steamid, minutes FROM playtime');
  return stmt.all();
}

module.exports = { getAllPlaytime, getLastUpdateTime };
