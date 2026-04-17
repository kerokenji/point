const fs = require('fs');
const path = require('path');

const MAPPING_PATH = path.join(__dirname, '../steam_discord_mapping.json');

function loadMapping() {
  const data = fs.readFileSync(MAPPING_PATH, 'utf8');
  return JSON.parse(data);
}

function extractAccountId(steamId) {
  if (!steamId) return null;
  return steamId.split(':').pop();
}

// Tạo map DiscordID → AccountID (chỉ lấy số cuối)
function createDiscordToAccountMap() {
  const mapping = loadMapping();
  const discordToAccount = {};
  for (const [steamFull, discordId] of Object.entries(mapping)) {
    const accountId = extractAccountId(steamFull);
    discordToAccount[discordId] = accountId;
  }
  return discordToAccount;
}

module.exports = { createDiscordToAccountMap, extractAccountId };
