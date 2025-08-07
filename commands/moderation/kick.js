const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Check if user is trying to kick themselves
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot kick yourself!`,
                ephemeral: true
            });
        }
        
        // Check if user is trying to kick the bot
        if (user.id === interaction.client.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot kick me!`,
                ephemeral: true
            });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member) {
                return await interaction.reply({
                    content: `${config.emojis.error} User is not in this server!`,
                    ephemeral: true
                });
            }
            
            // Check hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: `${config.emojis.error} You cannot kick this user due to role hierarchy!`,
                    ephemeral: true
                });
            }
            
            if (!member.kickable) {
                return await interaction.reply({
                    content: `${config.emojis.error} I cannot kick this user! Check my permissions and role hierarchy.`,
                    ephemeral: true
                });
            }
            
            // Try to send DM to user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`${config.emojis.kick} You have been kicked`)
                    .setColor(config.colors.warning)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${user.tag}: ${dmError.message}`);
            }
            
            // Kick the user
            await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.kick} User Kicked`)
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
                action: 'Kick',
                target: user,
                moderator: interaction.user,
                reason: reason
            });
            
        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to kick user: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
