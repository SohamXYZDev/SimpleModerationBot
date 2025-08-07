const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for clearing messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            // Defer reply since this might take time
            await interaction.deferReply({ ephemeral: true });
            
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            let messagesToDelete = messages.first(amount);
            
            // Filter by user if specified
            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id).first(amount);
            }
            
            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const validMessages = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            
            if (validMessages.size === 0) {
                return await interaction.editReply({
                    content: `${config.emojis.error} No messages found to delete! Messages must be newer than 14 days.`
                });
            }
            
            // Delete messages
            const deletedMessages = await interaction.channel.bulkDelete(validMessages, true);
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.success} Messages Cleared`)
                .setColor(config.colors.success)
                .addFields(
                    { name: 'Messages Deleted', value: `${deletedMessages.size}`, inline: true },
                    { name: 'Channel', value: `${interaction.channel}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            if (targetUser) {
                embed.addFields({ name: 'Target User', value: `${targetUser}`, inline: true });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: 'Clear Messages',
                target: targetUser || 'All users',
                moderator: interaction.user,
                reason: `${deletedMessages.size} messages deleted in ${interaction.channel.name}: ${reason}`
            });
            
        } catch (error) {
            console.error('Error clearing messages:', error);
            
            const errorMessage = `${config.emojis.error} Failed to clear messages: ${error.message}`;
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
