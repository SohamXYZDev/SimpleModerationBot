const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for the current channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for setting slowmode')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            await interaction.channel.setRateLimitPerUser(seconds, `${reason} | Set by ${interaction.user.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.success} Slowmode ${seconds === 0 ? 'Disabled' : 'Enabled'}`)
                .setColor(seconds === 0 ? config.colors.success : config.colors.warning)
                .addFields(
                    { name: 'Channel', value: `${interaction.channel}`, inline: true },
                    { name: 'Duration', value: seconds === 0 ? 'Disabled' : `${seconds} seconds`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: `Slowmode ${seconds === 0 ? 'Disabled' : 'Set'}`,
                target: `#${interaction.channel.name}`,
                moderator: interaction.user,
                reason: `${seconds === 0 ? 'Disabled' : `${seconds} seconds`}: ${reason}`
            });
            
        } catch (error) {
            console.error('Error setting slowmode:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to set slowmode: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
