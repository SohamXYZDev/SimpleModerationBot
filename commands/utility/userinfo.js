const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        
        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.info} User Information`)
                .setColor(config.colors.info)
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: 'Username', value: user.tag, inline: true },
                    { name: 'User ID', value: user.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false }
                );
            
            if (member) {
                embed.addFields(
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                    { name: 'Display Name', value: member.displayName, inline: true },
                    { name: 'Highest Role', value: member.roles.highest.toString(), inline: true }
                );
                
                // Check if user is timed out
                if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
                    embed.addFields({
                        name: 'Timeout Status',
                        value: `⏰ Timed out until <t:${Math.floor(member.communicationDisabledUntil.getTime() / 1000)}:F>`,
                        inline: false
                    });
                    embed.setColor(config.colors.warning);
                }
                
                // Add role list if user has roles
                const roles = member.roles.cache
                    .filter(role => role.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString());
                
                if (roles.length > 0) {
                    const roleList = roles.length > 10 
                        ? `${roles.slice(0, 10).join(', ')} and ${roles.length - 10} more...`
                        : roles.join(', ');
                    
                    embed.addFields({ name: `Roles [${roles.length}]`, value: roleList, inline: false });
                }
                
                // Add permissions if user has elevated permissions
                const keyPermissions = member.permissions.toArray().filter(perm => 
                    ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'BanMembers', 'KickMembers', 'ModerateMembers'].includes(perm)
                );
                
                if (keyPermissions.length > 0) {
                    embed.addFields({ name: 'Key Permissions', value: keyPermissions.join(', '), inline: false });
                }
            } else {
                embed.addFields({ name: 'Member Status', value: 'Not in this server', inline: true });
            }
            
            // Add bot status
            if (user.bot) {
                embed.addFields({ name: 'Account Type', value: '🤖 Bot Account', inline: true });
            }
            
            embed.setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting user info:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to get user information: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
