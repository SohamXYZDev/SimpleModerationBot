const config = require('../config.js');
const { logAction } = require('./logger.js');

// Store user message history for spam detection
const userMessageHistory = new Map();
const userTimeouts = new Set();

function initializeAntiSpam(client) {
    client.on('messageCreate', async (message) => {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;
        
        // Note: Removed permission check - anti-spam now works on everyone including admins
        
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
        await handleSpamDetection(message, 'message_frequency', userHistory.length, { timeoutDuration: config.spam.timeoutDuration });
        return;
    }
    
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
            await handleSpamDetection(message, 'cross_channel_spam', crossChannelMessages.length, { timeoutDuration: config.spam.timeoutDuration });
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
        
        // Enhanced message deletion using bulk delete - delete last 10 messages for all spam types
        try {
            const userHistory = userMessageHistory.get(userId) || [];
            const messagesToDelete = userHistory.slice(-10); // Last 10 messages (increased from 5)
            
            console.log(`🗑️ Attempting to bulk delete messages for user ${message.author.tag}`);
            
            // Group messages by channel for bulk deletion
            const messagesByChannel = new Map();
            
            // Add triggering message to the list
            if (!messagesByChannel.has(message.channel.id)) {
                messagesByChannel.set(message.channel.id, []);
            }
            messagesByChannel.get(message.channel.id).push(message.id);
            
            // Group historical messages by channel
            for (const msgData of messagesToDelete) {
                if (!messagesByChannel.has(msgData.channelId)) {
                    messagesByChannel.set(msgData.channelId, []);
                }
                
                try {
                    const channel = message.guild.channels.cache.get(msgData.channelId);
                    if (channel) {
                        // Fetch recent messages to find the ones to delete
                        const messages = await channel.messages.fetch({ limit: 100 });
                        const userMsg = messages.find(m => 
                            m.author.id === userId && 
                            Math.abs(m.createdTimestamp - msgData.timestamp) < 30000 // 30 second window
                        );
                        if (userMsg) {
                            messagesByChannel.get(msgData.channelId).push(userMsg.id);
                        }
                    }
                } catch (fetchError) {
                    console.log(`❌ Could not fetch messages from channel: ${fetchError.message}`);
                }
            }
            
            // Bulk delete messages in each channel
            for (const [channelId, messageIds] of messagesByChannel) {
                try {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel && messageIds.length > 0) {
                        // Remove duplicates and filter valid message IDs
                        const uniqueMessageIds = [...new Set(messageIds)];
                        
                        if (uniqueMessageIds.length === 1) {
                            // Single message - use regular delete
                            const msg = await channel.messages.fetch(uniqueMessageIds[0]).catch(() => null);
                            if (msg && msg.deletable) {
                                await msg.delete();
                                console.log(`✅ Deleted 1 message in #${channel.name}`);
                            }
                        } else if (uniqueMessageIds.length > 1) {
                            // Multiple messages - use bulk delete (only works for messages less than 14 days old)
                            const messagesToBulkDelete = [];
                            for (const msgId of uniqueMessageIds) {
                                try {
                                    const msg = await channel.messages.fetch(msgId).catch(() => null);
                                    if (msg && msg.deletable && (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000) {
                                        messagesToBulkDelete.push(msg);
                                    }
                                } catch (e) {
                                    // Message might already be deleted or not accessible
                                }
                            }
                            
                            if (messagesToBulkDelete.length > 1) {
                                await channel.bulkDelete(messagesToBulkDelete);
                                console.log(`✅ Bulk deleted ${messagesToBulkDelete.length} messages in #${channel.name}`);
                            } else if (messagesToBulkDelete.length === 1) {
                                await messagesToBulkDelete[0].delete();
                                console.log(`✅ Deleted 1 message in #${channel.name}`);
                            }
                        }
                    }
                } catch (deleteError) {
                    console.log(`❌ Could not bulk delete in channel ${channelId}: ${deleteError.message}`);
                }
            }
            
        } catch (bulkDeleteError) {
            console.log(`Could not bulk delete messages: ${bulkDeleteError.message}`);
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
        
        // Remove from timeout set after shorter time to allow continued detection
        const cooldownTime = 5000; // 5 seconds cooldown regardless of timeout duration
        setTimeout(() => {
            userTimeouts.delete(userId);
            console.log(`🔄 Cooldown expired for ${message.author.tag} - spam detection re-enabled`);
        }, cooldownTime);
        
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
