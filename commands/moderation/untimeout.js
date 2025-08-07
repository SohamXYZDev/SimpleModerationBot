const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for removing the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member) {
                return await interaction.reply({
                    content: `${config.emojis.error} User is not in this server!`,
                    ephemeral: true
                });
            }
            
            // Check if user is timed out
            if (!member.communicationDisabledUntil || member.communicationDisabledUntil <= new Date()) {
                return await interaction.reply({
                    content: `${config.emojis.error} User is not currently timed out!`,
                    ephemeral: true
                });
            }
            
            // Check hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: `${config.emojis.error} You cannot remove timeout from this user due to role hierarchy!`,
                    ephemeral: true
                });
            }
            
            if (!member.moderatable) {
                return await interaction.reply({
                    content: `${config.emojis.error} I cannot modify timeout for this user! Check my permissions and role hierarchy.`,
                    ephemeral: true
                });
            }
            
            // Remove timeout
            await member.timeout(null, `${reason} | Timeout removed by ${interaction.user.tag}`);
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.success} Timeout Removed`)
                .setColor(config.colors.success)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${user} (${user.tag})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: 'Timeout Removed',
                target: user,
                moderator: interaction.user,
                reason: reason
            });
            
        } catch (error) {
            console.error('Error removing timeout:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to remove timeout: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
