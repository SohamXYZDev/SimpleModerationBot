const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
            return await interaction.reply({
                content: `${config.emojis.error} Invalid user ID format!`,
                ephemeral: true
            });
        }
        
        try {
            // Check if user is banned
            const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);
            
            if (!banInfo) {
                return await interaction.reply({
                    content: `${config.emojis.error} User with ID ${userId} is not banned!`,
                    ephemeral: true
                });
            }
            
            // Unban the user
            await interaction.guild.bans.remove(userId, `${reason} | Unbanned by ${interaction.user.tag}`);
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.success} User Unbanned`)
                .setColor(config.colors.success)
                .setThumbnail(banInfo.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${banInfo.user.tag} (${userId})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Original Ban Reason', value: banInfo.reason || 'No reason provided', inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: 'Unban',
                target: banInfo.user,
                moderator: interaction.user,
                reason: reason
            });
            
        } catch (error) {
            console.error('Error unbanning user:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to unban user: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
