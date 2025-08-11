const config = require('../config.js');
const { logAction } = require('./logger.js');

function initializeAutoModeration(client) {
    // Handle new member joins
    client.on('guildMemberAdd', async (member) => {
        try {
            // Check for banned username
            if (member.displayName.toLowerCase() === config.bannedUsername.toLowerCase()) {
                // Check if user is whitelisted (protected from auto-ban)
                if (config.whitelistUserId && member.user.id === config.whitelistUserId) {
                    await logAction('automod', {
                        action: 'Whitelist protection applied',
                        user: member.user,
                        trigger: 'Banned Username Detection (Protected)',
                        details: `Whitelisted user "${config.bannedUsername}" joined - auto-ban skipped`
                    });
                    
                    console.log(`🛡️ Protected whitelisted user ${member.user.tag} from auto-ban (ID: ${member.user.id})`);
                } else {
                    // Purge last 50 messages before banning
                    const purged = await purgeUserMessages(member, 50);
                    await member.ban({ 
                        reason: `Auto-moderation: Display name "${config.bannedUsername}" detected (Purged ${purged} messages)`
                    });
                    
                    await logAction('automod', {
                        action: 'Permanent ban applied',
                        user: member.user,
                        trigger: 'Banned Username Detection',
                        details: `New member with display name "${config.bannedUsername}" automatically banned. Purged ${purged} messages before ban.`
                    });
                    
                    console.log(`🔨 Auto-banned new member ${member.user.tag} for banned username: ${config.bannedUsername} (Purged ${purged} messages)`);
                }
            }
            
            // Log member join
            await logAction('member', {
                event: 'Member Joined',
                user: member.user,
                details: `Account created: ${member.user.createdAt.toDateString()}`
            });
            
        } catch (error) {
            console.error('❌ Error in auto-moderation (member join):', error);
            await logAction('error', {
                type: 'Auto-Moderation Error',
                source: 'autoModeration.js - guildMemberAdd',
                message: error.message
            });
        }
    });
    
    // Handle member updates (nickname/username changes)
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        try {
            // Check if display name changed to banned username
            if (oldMember.displayName.toLowerCase() !== config.bannedUsername.toLowerCase() && 
                newMember.displayName.toLowerCase() === config.bannedUsername.toLowerCase()) {
                
                // Check if user is whitelisted (protected from auto-ban)
                if (config.whitelistUserId && newMember.user.id === config.whitelistUserId) {
                    await logAction('automod', {
                        action: 'Whitelist protection applied',
                        user: newMember.user,
                        trigger: 'Banned Username Change (Protected)',
                        details: `Whitelisted user changed display name to "${config.bannedUsername}" - auto-ban skipped`
                    });
                    
                    console.log(`🛡️ Protected whitelisted user ${newMember.user.tag} from auto-ban (ID: ${newMember.user.id})`);
                } else {
                    const purged = await purgeUserMessages(newMember, 50);
                    await newMember.ban({ 
                        reason: `Auto-moderation: Display name changed to "${config.bannedUsername}" (Purged ${purged} messages)`
                    });
                    
                    await logAction('automod', {
                        action: 'Permanent ban applied',
                        user: newMember.user,
                        trigger: 'Banned Username Change',
                        details: `Member changed display name to "${config.bannedUsername}" and was automatically banned. Purged ${purged} messages before ban.`
                    });
                    
                    console.log(`🔨 Auto-banned member ${newMember.user.tag} for changing display name to ${config.bannedUsername} (Purged ${purged} messages)`);
                }
            }
        } catch (error) {
            console.error('❌ Error in auto-moderation (member update):', error);
            await logAction('error', {
                type: 'Auto-Moderation Error',
                source: 'autoModeration.js - guildMemberUpdate',
                message: error.message
            });
        }
    });
    
    // Handle member leaves
    client.on('guildMemberRemove', async (member) => {
        try {
            await logAction('member', {
                event: 'Member Left',
                user: member.user,
                details: `Joined: ${member.joinedAt ? member.joinedAt.toDateString() : 'Unknown'}`
            });
        } catch (error) {
            console.error('❌ Error logging member leave:', error);
        }
    });
    
    // Handle message updates for potential rule violations
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        // Skip if not in guild or message is from bot
        if (!newMessage.guild || newMessage.author.bot) return;
        
        try {
            // Check for banned username in edited message content
            if (newMessage.content && newMessage.content.toLowerCase().includes(config.bannedUsername.toLowerCase()) && 
                newMessage.content.toLowerCase().includes('spam')) {
                
                // Log suspicious edit
                await logAction('automod', {
                    action: 'Suspicious message edit detected',
                    user: newMessage.author,
                    trigger: 'Banned Username Spam Keywords',
                    details: `Message edited in ${newMessage.channel}: "${newMessage.content.substring(0, 100)}..."`
                });
            }
        } catch (error) {
            console.error('❌ Error in message update auto-mod:', error);
        }
    });
    
    // Handle bulk message deletions (potential raids)
    client.on('messageDeleteBulk', async (messages) => {
        try {
            const channel = messages.first()?.channel;
            if (!channel || !channel.guild) return;
            
            await logAction('automod', {
                action: 'Bulk message deletion detected',
                user: 'System',
                trigger: 'Bulk Delete Event',
                details: `${messages.size} messages deleted in ${channel}`
            });
        } catch (error) {
            console.error('❌ Error logging bulk delete:', error);
        }
    });
}

// Utility function to check if a user should be auto-moderated
function shouldAutoModerate(member) {
    // Skip if user has moderation permissions
    if (member.permissions.has('ModerateMembers')) return false;
    
    // Skip if user has specific roles (you can expand this)
    const exemptRoles = ['Moderator', 'Admin', 'Staff'];
    if (member.roles.cache.some(role => exemptRoles.includes(role.name))) return false;
    
    return true;
}

// Purge up to maxCount recent messages by the member across text channels
async function purgeUserMessages(member, maxCount = 50) {
    const guild = member.guild;
    if (!guild) return 0;
    let remaining = maxCount;
    let totalPurged = 0;
    try {
        // Iterate over text-based channels (exclude threads & voice)
        const channels = guild.channels.cache.filter(c => c.type === 0 && c.viewable && c.permissionsFor(guild.members.me).has('ManageMessages'));
        for (const channel of channels.values()) {
            if (remaining <= 0) break;
            try {
                const fetched = await channel.messages.fetch({ limit: 100 });
                const userMessages = fetched.filter(m => m.author.id === member.id).first(remaining);
                if (userMessages.length === 0) continue;
                // Bulk delete supports passing a collection/array
                const deleted = await channel.bulkDelete(userMessages, true).catch(() => null);
                const count = deleted ? deleted.size : 0;
                totalPurged += count;
                remaining -= count;
            } catch (e) {
                // Continue silently on per-channel errors
                continue;
            }
        }
        if (totalPurged > 0) {
            await logAction('automod', {
                action: 'Pre-ban message purge',
                user: member.user,
                trigger: 'Banned Username Enforcement',
                details: `Purged ${totalPurged} messages prior to ban (Requested: ${maxCount}).`
            });
        }
    } catch (err) {
        console.error(`❌ Error purging messages for ${member.user.tag}:`, err);
    }
    return totalPurged;
}

module.exports = {
    initializeAutoModeration,
    shouldAutoModerate
};
