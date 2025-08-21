const config = require('../config.js');
const { logAction } = require('./logger.js');

// Store user message history for spam detection
const userMessageHistory = new Map();
const userTimeouts = new Set();

function initializeAntiSpam(client) {
    client.on('messageCreate', async (message) => {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;
        
        // Bypass for admins or members with bypass roles
        const member = message.member;
        const isAdmin = member && (
            member.permissions.has('Administrator') || 
            member.permissions.has('ManageGuild') ||
            member.permissions.has('ManageMessages')
        );
        const hasBypassRole = member && config.automodBypassRoles.length > 0 && member.roles.cache.some(r => config.automodBypassRoles.includes(r.id));
        const bypass = isAdmin || hasBypassRole;
        
        // Keyword censor: delete messages containing any banned keyword (non-admins/non-bypass only)
        if (!bypass && typeof message.content === 'string' && config.censorKeywords.length > 0) {
            const contentLower = message.content.toLowerCase();
            const found = config.censorKeywords.find(keyword => contentLower.includes(keyword));
            if (found) {
                try {
                    await message.delete();
                    await logAction('automod', {
                        action: 'Message deleted',
                        user: message.author,
                        trigger: 'Keyword censor',
                        details: `Deleted message containing banned keyword (${found}) in #${message.channel.name}`
                    });
                } catch (e) {
                    // ignore
                }
                return; // stop further processing for this message
            }
        }
        
        // If bypass, do not run spam checks
        if (bypass) return;
        
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
    
    // Remove punishment for non-identical message spam: disable generic frequency punishment
    // (Keep only identical, cross-channel identical, and attachment spam rules)
    
    // Check for identical content spam
    const recentMessages = userHistory.slice(-3);
    if (recentMessages.length >= 3) {
        const identicalCount = recentMessages.filter(msg => 
            msg.content === message.content && msg.content.length > 0
        ).length;
        
        if (identicalCount >= 3) {
            // Check if all identical messages are in the same channel
            const identicalMessages = recentMessages.filter(msg => msg.content === message.content);
            const sameChannel = identicalMessages.every(msg => msg.channelId === message.channel.id);
            
            await handleSpamDetection(message, 'identical_content', identicalCount, { 
                timeoutDuration: sameChannel ? 60000 : config.spam.timeoutDuration, // 1 minute vs 7 days
                sameChannel: sameChannel
            });
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
            await handleSpamDetection(message, 'cross_channel_identical', crossChannelMessages.length, { timeoutDuration: config.spam.timeoutDuration });
            return;
        }
    }
    
    // Check for attachment spam
    const attachmentMessages = userHistory.filter(msg => msg.attachments > 0);
    if (attachmentMessages.length >= 4) {
        // Check if all attachment messages are in the same channel
        const sameChannel = attachmentMessages.every(msg => msg.channelId === message.channel.id);
        
        await handleSpamDetection(message, 'attachment_spam', attachmentMessages.length, { 
            timeoutDuration: sameChannel ? 60000 : config.spam.timeoutDuration, // 1 minute vs 7 days
            sameChannel: sameChannel
        });
        return;
    }
}

async function handleSpamDetection(message, triggerType, count, options = {}) {
    const userId = message.author.id;
    const { timeoutDuration = config.spam.timeoutDuration, sameChannel = false } = options;
    
    try {
        // Add user to timeout set to prevent duplicate actions
        userTimeouts.add(userId);
        
        // Timeout the user with appropriate duration (skip if user can't be timed out)
        let timeoutSuccess = false;
        try {
            await message.member.timeout(timeoutDuration, `Auto-moderation: ${triggerType} (${count} violations)`);
            timeoutSuccess = true;
            console.log(`⏰ Successfully timed out ${message.author.tag} for ${timeoutDuration / 1000}s`);
        } catch (timeoutError) {
            console.log(`⚠️ Could not timeout ${message.author.tag}: ${timeoutError.message} (probably admin/higher role)`);
            // Continue with message deletion even if timeout fails
        }
        
        // Enhanced bulk message deletion - collect and delete ALL recent messages from user
        try {
            console.log(`🗑️ Attempting to bulk delete recent messages for user ${message.author.tag}`);
            
            // Get all channels in the guild
            const textChannels = message.guild.channels.cache.filter(channel => 
                channel.type === 0 && // Text channel
                channel.permissionsFor(message.guild.members.me).has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])
            );
            
            let totalDeleted = 0;
            const maxDeletions = 10; // Maximum messages to delete across all channels
            
            // Process each channel (with rate limiting)
            const channelArray = Array.from(textChannels.values());
            for (let i = 0; i < channelArray.length && totalDeleted < maxDeletions; i++) {
                const channel = channelArray[i];
                try {
                    // Fetch recent messages (last 100)
                    const messages = await channel.messages.fetch({ limit: 100 });
                    
                    // Filter messages from the spam user (last 15 minutes to be safe)
                    const userMessages = messages.filter(msg => 
                        msg.author.id === userId && 
                        (Date.now() - msg.createdTimestamp) < 15 * 60 * 1000 && // 15 minutes
                        (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000 && // Less than 14 days (Discord limit)
                        msg.deletable
                    );
                    
                    if (userMessages.size > 0) {
                        // Limit to remaining deletion quota
                        const remainingDeletions = maxDeletions - totalDeleted;
                        const messagesToDelete = userMessages.first(Math.min(userMessages.size, remainingDeletions));
                        
                        if (messagesToDelete.length === 1) {
                            // Single message - use regular delete
                            await messagesToDelete[0].delete();
                            totalDeleted += 1;
                            console.log(`✅ Deleted 1 message in #${channel.name}`);
                        } else if (messagesToDelete.length > 1) {
                            // Multiple messages - use bulk delete
                            const deleted = await channel.bulkDelete(messagesToDelete, true);
                            totalDeleted += deleted.size;
                            console.log(`✅ Bulk deleted ${deleted.size} messages in #${channel.name}`);
                        }
                    }
                    
                    // Small delay to prevent rate limiting (only if more channels to process and not at max deletions)
                    if (i < channelArray.length - 1 && totalDeleted > 0 && totalDeleted < maxDeletions) {
                        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
                    }
                    
                } catch (channelError) {
                    console.log(`❌ Could not process channel #${channel.name}: ${channelError.message}`);
                }
            }
            
            console.log(`🎯 Total messages deleted: ${totalDeleted} (max: ${maxDeletions})`);
            
        } catch (bulkDeleteError) {
            console.log(`❌ Error in bulk delete process: ${bulkDeleteError.message}`);
        }
        
        // Format timeout duration for logging
        const timeoutText = timeoutSuccess 
            ? (timeoutDuration === 60000 ? '1 minute timeout applied' : '7-day timeout applied')
            : 'Messages deleted (timeout failed - user has higher permissions)';
        const channelContext = sameChannel ? ' (same channel)' : ' (cross-channel)';
        
        // Log the action
        await logAction('spam', {
            user: message.author,
            action: timeoutText,
            messageCount: count,
            timeWindow: `${config.spam.timeWindow / 1000}s`,
            channel: message.channel,
            trigger: `${triggerType}${channelContext}`
        });
        
        // Clear user history
        userMessageHistory.delete(userId);
        
        // Check if user has admin permissions (no cooldown for admins)
        const isAdmin = message.member && (
            message.member.permissions.has('Administrator') || 
            message.member.permissions.has('ManageGuild') ||
            message.member.permissions.has('ManageMessages')
        );
        
        // Remove from timeout set after shorter time to allow continued detection
        // No cooldown for admins, 5 seconds for regular users
        const cooldownTime = isAdmin ? 0 : 5000;
        
        if (cooldownTime > 0) {
            setTimeout(() => {
                userTimeouts.delete(userId);
                console.log(`🔄 Cooldown expired for ${message.author.tag} - spam detection re-enabled`);
            }, cooldownTime);
        } else {
            // Immediate cooldown removal for admins
            userTimeouts.delete(userId);
            console.log(`🔄 No cooldown for admin ${message.author.tag} - spam detection remains active`);
        }
        
        const actionText = timeoutSuccess 
            ? (timeoutDuration === 60000 ? 'timed out for 1 minute' : 'timed out for 7 days')
            : 'had messages deleted (timeout failed)';
        console.log(`🔨 Auto-${actionText} user ${message.author.tag} for ${triggerType}${channelContext}`);
        
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
