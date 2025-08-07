const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a warning to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        // Check if user is trying to warn themselves
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot warn yourself!`,
                ephemeral: true
            });
        }
        
        // Check if user is trying to warn the bot
        if (user.id === interaction.client.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot warn me!`,
                ephemeral: true
            });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            // Check hierarchy if member exists
            if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: `${config.emojis.error} You cannot warn this user due to role hierarchy!`,
                    ephemeral: true
                });
            }
            
            // Try to send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`${config.emojis.warning} Warning Issued`)
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Please follow the server rules to avoid further action.' });
                
                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${user.tag}: ${dmError.message}`);
            }
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.warning} Warning Issued`)
                .setColor(config.colors.warning)
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
                action: 'Warning',
                target: user,
                moderator: interaction.user,
                reason: reason
            });
            
        } catch (error) {
            console.error('Error issuing warning:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to issue warning: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
