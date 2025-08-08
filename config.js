require('dotenv').config();

module.exports = {
    // Bot Identity (configurable via .env)
    token: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    
    // Bot Information
    botName: process.env.BOT_NAME || 'MMM Moderation Bot',
    botVersion: process.env.BOT_VERSION || '1.0.0',
    botAuthor: process.env.BOT_AUTHOR || 'Unknown',
    botActivity: process.env.BOT_ACTIVITY || 'for violations',
    
    // Channel Configuration
    logsChannel: process.env.LOGS_CHANNEL || 'logs',
    
    // Anti-Spam Configuration
    spam: {
        messageLimit: parseInt(process.env.SPAM_MESSAGE_LIMIT) || 5,
        timeWindow: parseInt(process.env.SPAM_TIME_WINDOW) || 10000, // 10 seconds
        timeoutDuration: parseInt(process.env.AUTO_TIMEOUT_DURATION) || 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    
    // Username Filter Configuration
    bannedUsername: process.env.BANNED_USERNAME || 'BD',
    banBannedUsername: process.env.BAN_BANNED_USERNAME === 'true' || true, // Ban instead of timeout
    
    // Bot Permissions
    requiredPermissions: process.env.REQUIRED_PERMISSIONS || '8', // Administrator
    
    // Colors for embeds
    colors: {
        success: 0x00FF00,
        error: 0xFF0000,
        warning: 0xFFFF00,
        info: 0x0099FF,
        moderation: 0xFF6600
    },
    
    // Emojis
    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        moderation: '🔨',
        timeout: '⏰',
        ban: '🔨',
        kick: '👢',
        mute: '🔇'
    }
};
