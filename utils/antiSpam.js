const config = require('../config.js');
const { logAction } = require('./logger.js');

// Store user message history for spam detection
const userMessageHistory = new Map();
const userTimeouts = new Set();

function initializeAntiSpam(client) {
    client.on('messageCreate', async (message) => {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;
        
        // Ignore messages from members with moderation permissions
        if (message.member && message.member.permissions.has('ModerateMembers')) return;
        
        const userId = message.author.id;
        const currentTime = Date.now();
        
        // Initialize user history if not exists
        if (!userMessageHistory.has(userId)) {
            userMessageHistory.set(userId, []);
        }
        
        const userHistory = userMessageHistory.get(userId);
        
        // Add current message to history
        userHistory.push({
            content: message.content,
            channelId: message.channel.id,
            timestamp: currentTime,
            attachments: message.attachments.size,
            embeds: message.embeds.length
        });
        
        // Remove messages older than the time window
        const validMessages = userHistory.filter(msg => 
            currentTime - msg.timestamp < config.spam.timeWindow
        );
        userMessageHistory.set(userId, validMessages);
        
        // Check for spam patterns
        await checkForSpam(message, validMessages);
    });
    
    // Clean up old data every 5 minutes
    setInterval(() => {
        const currentTime = Date.now();
        for (const [userId, history] of userMessageHistory.entries()) {
            const validMessages = history.filter(msg => 
                currentTime - msg.timestamp < config.spam.timeWindow * 2
            );
            
            if (validMessages.length === 0) {
                userMessageHistory.delete(userId);
            } else {
                userMessageHistory.set(userId, validMessages);
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
}

async function checkForSpam(message, userHistory) {
    const userId = message.author.id;
    
    // Skip if user is already timed out
    if (userTimeouts.has(userId)) return;
    
    // Check message frequency
    if (userHistory.length >= config.spam.messageLimit) {
        await handleSpamDetection(message, 'message_frequency', userHistory.length);
        return;
    }
    
    // Check for identical content spam
    const recentMessages = userHistory.slice(-3);
    if (recentMessages.length >= 3) {
        const identicalCount = recentMessages.filter(msg => 
            msg.content === message.content && msg.content.length > 0
        ).length;
        
        if (identicalCount >= 3) {
            await handleSpamDetection(message, 'identical_content', identicalCount);
            return;
        }
    }
    
    // Check for cross-channel spam
    const uniqueChannels = new Set(userHistory.map(msg => msg.channelId));
    if (uniqueChannels.size >= 3 && userHistory.length >= 4) {
        const crossChannelMessages = userHistory.filter(msg => 
            msg.content === message.content && msg.content.length > 0
        );
        
        if (crossChannelMessages.length >= 3) {
            await handleSpamDetection(message, 'cross_channel_spam', crossChannelMessages.length);
            return;
        }
    }
    
    // Check for attachment spam
    const attachmentMessages = userHistory.filter(msg => msg.attachments > 0);
    if (attachmentMessages.length >= 4) {
        await handleSpamDetection(message, 'attachment_spam', attachmentMessages.length);
        return;
    }
}

async function handleSpamDetection(message, triggerType, count) {
    const userId = message.author.id;
    
    try {
        // Add user to timeout set to prevent duplicate actions
        userTimeouts.add(userId);
        
        // Timeout the user for 7 days
        await message.member.timeout(config.spam.timeoutDuration, `Auto-moderation: ${triggerType} (${count} violations)`);
        
        // Try to delete recent messages
        try {
            const userHistory = userMessageHistory.get(userId) || [];
            const recentMessages = userHistory.slice(-5); // Last 5 messages
            
            for (const msgData of recentMessages) {
                try {
                    const channel = message.guild.channels.cache.get(msgData.channelId);
                    if (channel) {
                        const messages = await channel.messages.fetch({ limit: 50 });
                        const userMsg = messages.find(m => 
                            m.author.id === userId && 
                            Math.abs(m.createdTimestamp - msgData.timestamp) < 5000
                        );
                        if (userMsg) {
                            await userMsg.delete();
                        }
                    }
                } catch (deleteError) {
                    console.log(`Could not delete message: ${deleteError.message}`);
                }
            }
        } catch (bulkDeleteError) {
            console.log(`Could not bulk delete messages: ${bulkDeleteError.message}`);
        }
        
        // Log the action
        await logAction('spam', {
            user: message.author,
            action: `7-day timeout applied`,
            messageCount: count,
            timeWindow: `${config.spam.timeWindow / 1000}s`,
            channel: message.channel,
            trigger: triggerType
        });
        
        // Clear user history
        userMessageHistory.delete(userId);
        
        // Remove from timeout set after 1 minute to allow re-detection if needed
        setTimeout(() => {
            userTimeouts.delete(userId);
        }, 60000);
        
        console.log(`🔨 Auto-timed out user ${message.author.tag} for ${triggerType}`);
        
    } catch (error) {
        console.error('❌ Error handling spam detection:', error);
        userTimeouts.delete(userId);
        
        await logAction('error', {
            type: 'Anti-Spam Error',
            source: 'antiSpam.js',
            message: error.message
        });
    }
}

// Function to manually reset user spam history (for use in commands)
function resetUserSpamHistory(userId) {
    userMessageHistory.delete(userId);
    userTimeouts.delete(userId);
}

module.exports = {
    initializeAntiSpam,
    resetUserSpamHistory
};
