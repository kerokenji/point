const path = require('path');

const TOKEN = "MTQ2MzAzNDQ2MjkxMTU5NDU4MQxjes";   // ← Token của bạn

const BASE_DIR = __dirname;
const SQ3_PATH = path.join(BASE_DIR, "sourcemod-local.sq3");
const MAPPING_PATH = path.join(BASE_DIR, "steam_discord_mapping.json");

const GUILD_ID = "1389473239754997870";
const OWNER_ID = "453518925997670411";
const ANNOUNCE_CHANNEL_ID = "1389473240824414306";

const ALLOWED_GUILD_IDS = ["1389473239754997870", "1295359112053391423"];

const PLAYTIME_ROLES = [
    { hours: 5,    min_min: 300,    role_id: "1468536962611679362", name: "5 tiếng" },
    { hours: 20,   min_min: 1200,   role_id: "1468537240866258987", name: "20 tiếng" },
    { hours: 50,   min_min: 3000,   role_id: "1468537280494047289", name: "50 tiếng" },
    { hours: 100,  min_min: 6000,   role_id: "1468537312970281163", name: "100 tiếng" },
    { hours: 500,  min_min: 30000,  role_id: "1468537346713714772", name: "500 tiếng" },
    { hours: 1000, min_min: 60000,  role_id: "1468537374026895521", name: "1000 tiếng" },
    { hours: 2000, min_min: 120000, role_id: "1468539599193374750", name: "2000 tiếng" },
    { hours: 5000, min_min: 300000, role_id: "1468540038383140904", name: "5000 tiếng" }
];

const VN_TZ = 'Asia/Ho_Chi_Minh';

module.exports = {
    TOKEN,
    SQ3_PATH,
    MAPPING_PATH,
    GUILD_ID,
    OWNER_ID,
    ANNOUNCE_CHANNEL_ID,
    ALLOWED_GUILD_IDS,
    PLAYTIME_ROLES,
    VN_TZ
};
