const CHAT_CHUNG_ID = "1389473240824414306";
const IP_CONNECT_CHANNEL_ID = "1423655176182562816";
const MOD_LINK = "https://steamcommunity.com/sharedfiles/filedetails/?id=3667391237";

module.exports = (client) => {
    client.on('guildMemberAdd', async (member) => {
        // === DÒNG QUAN TRỌNG: Nếu là bot thì thoát luôn, không làm gì cả ===
        if (member.user.bot) return;

        console.log(`➡️ Người dùng mới: ${member.user.tag}. Đang đợi 1 phút để kiểm tra...`);

        setTimeout(async () => {
            try {
                // Kiểm tra xem người dùng còn ở trong server không
                const guild = client.guilds.cache.get(member.guild.id);
                if (!guild) return;

                const isStillInServer = await guild.members.fetch(member.id).catch(() => null);

                if (isStillInServer) {
                    const channel = client.channels.cache.get(CHAT_CHUNG_ID);
                    if (channel) {
                        await channel.send(
                            `<@${member.id}> bạn mới vào server thì vào <#${IP_CONNECT_CHANNEL_ID}> để setting lại game để tránh Crash nha.\n` +
                            `Nhớ subscribe mod này để không bị tình trạng ERROR nha: <${MOD_LINK}>`
                        );
                        console.log(`✅ Đã gửi lời chào đến ${member.user.tag}`);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi thực hiện tính năng welcome:', error);
            }
        }, 60000); 
    });
};