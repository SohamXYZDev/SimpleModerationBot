const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock a channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock the current channel')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking the channel')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock the current channel')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unlocking the channel')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            const channel = interaction.channel;
            const everyoneRole = interaction.guild.roles.everyone;
            
            if (subcommand === 'lock') {
                // Lock the channel by denying send message permissions
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false
                }, { reason: `${reason} | Locked by ${interaction.user.tag}` });
                
                const embed = new EmbedBuilder()
                    .setTitle(`${config.emojis.warning} Channel Locked`)
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Channel', value: `${channel}`, inline: true },
                        { name: 'Moderator', value: `${interaction.user}`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                
                // Send a message to the channel about the lock
                const lockNotice = new EmbedBuilder()
                    .setTitle('🔒 Channel Locked')
                    .setColor(config.colors.warning)
                    .setDescription(`This channel has been locked by ${interaction.user}.\n**Reason:** ${reason}`)
                    .setTimestamp();
                
                await channel.send({ embeds: [lockNotice] });
                
                // Log the action
                await logAction('moderation', {
                    action: 'Channel Locked',
                    target: `#${channel.name}`,
                    moderator: interaction.user,
                    reason: reason
                });
                
            } else if (subcommand === 'unlock') {
                // Unlock the channel by removing permission overwrites for everyone role
                const permissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
                if (permissions) {
                    await permissions.edit({
                        SendMessages: null,
                        AddReactions: null,
                        CreatePublicThreads: null,
                        CreatePrivateThreads: null
                    }, { reason: `${reason} | Unlocked by ${interaction.user.tag}` });
                }
                
                const embed = new EmbedBuilder()
                    .setTitle(`${config.emojis.success} Channel Unlocked`)
                    .setColor(config.colors.success)
                    .addFields(
                        { name: 'Channel', value: `${channel}`, inline: true },
                        { name: 'Moderator', value: `${interaction.user}`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                
                // Send a message to the channel about the unlock
                const unlockNotice = new EmbedBuilder()
                    .setTitle('🔓 Channel Unlocked')
                    .setColor(config.colors.success)
                    .setDescription(`This channel has been unlocked by ${interaction.user}.\n**Reason:** ${reason}`)
                    .setTimestamp();
                
                await channel.send({ embeds: [unlockNotice] });
                
                // Log the action
                await logAction('moderation', {
                    action: 'Channel Unlocked',
                    target: `#${channel.name}`,
                    moderator: interaction.user,
                    reason: reason
                });
            }
            
        } catch (error) {
            console.error('Error in lockdown command:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to ${subcommand} channel: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
