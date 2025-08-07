const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('delete_messages')
                .setDescription('Delete messages from the last 7 days')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessages = interaction.options.getBoolean('delete_messages') || false;
        
        // Check if user is trying to ban themselves
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot ban yourself!`,
                ephemeral: true
            });
        }
        
        // Check if user is trying to ban the bot
        if (user.id === interaction.client.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot ban me!`,
                ephemeral: true
            });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            // Check if user is already banned
            try {
                const banInfo = await interaction.guild.bans.fetch(user.id);
                if (banInfo) {
                    return await interaction.reply({
                        content: `${config.emojis.error} ${user.tag} is already banned!`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                // User is not banned, continue
            }
            
            // Check hierarchy if member exists
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({
                        content: `${config.emojis.error} You cannot ban this user due to role hierarchy!`,
                        ephemeral: true
                    });
                }
                
                if (!member.bannable) {
                    return await interaction.reply({
                        content: `${config.emojis.error} I cannot ban this user! Check my permissions and role hierarchy.`,
                        ephemeral: true
                    });
                }
            }
            
            // Ban the user
            await interaction.guild.bans.create(user.id, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageDays: deleteMessages ? 7 : 0
            });
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.ban} User Banned`)
                .setColor(config.colors.error)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${user} (${user.tag})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            if (deleteMessages) {
                embed.addFields({ name: 'Messages Deleted', value: 'Last 7 days', inline: true });
            }
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: 'Ban',
                target: user,
                moderator: interaction.user,
                reason: reason
            });
            
        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to ban user: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
