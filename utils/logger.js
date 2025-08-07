const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

let logChannel = null;

function initializeLogger(client) {
    client.on('ready', async () => {
        try {
            const guild = client.guilds.cache.get(config.guildId);
            if (guild) {
                // Try to find existing logs channel
                logChannel = guild.channels.cache.find(channel => 
                    channel.name === config.logsChannel && channel.type === 0
                );
                
                // If no logs channel exists, create one
                if (!logChannel) {
                    logChannel = await guild.channels.create({
                        name: config.logsChannel,
                        type: 0, // Text channel
                        topic: `Moderation logs for ${config.botName}`,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone.id,
                                deny: ['SendMessages'],
                                allow: ['ViewChannel', 'ReadMessageHistory']
                            }
                        ]
                    });
                    console.log(`📝 Created logs channel: #${logChannel.name}`);
                } else {
                    console.log(`📝 Found existing logs channel: #${logChannel.name}`);
                }
            }
        } catch (error) {
            console.error('❌ Error initializing logger:', error);
        }
    });
}

async function logAction(type, data) {
    if (!logChannel) return;
    
    try {
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: `${config.botName} v${config.botVersion}` });
        
        switch (type) {
            case 'moderation':
                embed
                    .setTitle(`${config.emojis.moderation} Moderation Action`)
                    .setColor(config.colors.moderation)
                    .addFields(
                        { name: 'Action', value: data.action, inline: true },
                        { name: 'Target', value: `${data.target}`, inline: true },
                        { name: 'Moderator', value: `${data.moderator}`, inline: true },
                        { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
                    );
                if (data.duration) {
                    embed.addFields({ name: 'Duration', value: data.duration, inline: true });
                }
                break;
                
            case 'automod':
                embed
                    .setTitle(`${config.emojis.warning} Auto-Moderation`)
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Action', value: data.action, inline: true },
                        { name: 'User', value: `${data.user}`, inline: true },
                        { name: 'Trigger', value: data.trigger, inline: true },
                        { name: 'Details', value: data.details || 'No additional details', inline: false }
                    );
                break;
                
            case 'spam':
                embed
                    .setTitle(`${config.emojis.timeout} Anti-Spam Action`)
                    .setColor(config.colors.error)
                    .addFields(
                        { name: 'User', value: `${data.user}`, inline: true },
                        { name: 'Action', value: data.action, inline: true },
                        { name: 'Messages Detected', value: `${data.messageCount}`, inline: true },
                        { name: 'Time Window', value: data.timeWindow, inline: true },
                        { name: 'Channel', value: `${data.channel}`, inline: true }
                    );
                break;
                
            case 'member':
                embed
                    .setTitle(`${config.emojis.info} Member Event`)
                    .setColor(config.colors.info)
                    .addFields(
                        { name: 'Event', value: data.event, inline: true },
                        { name: 'User', value: `${data.user}`, inline: true }
                    );
                if (data.details) {
                    embed.addFields({ name: 'Details', value: data.details, inline: false });
                }
                break;
                
            case 'error':
                embed
                    .setTitle(`${config.emojis.error} Error`)
                    .setColor(config.colors.error)
                    .addFields(
                        { name: 'Error Type', value: data.type, inline: true },
                        { name: 'Command/Event', value: data.source || 'Unknown', inline: true },
                        { name: 'Error Message', value: data.message.substring(0, 1000), inline: false }
                    );
                break;
        }
        
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Error logging action:', error);
    }
}

async function logCommand(interaction, commandName, success = true, error = null) {
    const data = {
        action: success ? `Command executed: /${commandName}` : `Command failed: /${commandName}`,
        moderator: interaction.user,
        target: interaction.options?.getUser('user') || 'N/A',
        reason: error ? `Error: ${error.message}` : 'Command executed successfully'
    };
    
    await logAction('moderation', data);
}

module.exports = {
    initializeLogger,
    logAction,
    logCommand
};
