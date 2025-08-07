const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const config = require('../../config.js');

function parseDuration(duration) {
    const units = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };
    
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    const [, amount, unit] = match;
    const ms = parseInt(amount) * units[unit];
    
    // Discord timeout limit is 28 days
    if (ms > 28 * 24 * 60 * 60 * 1000) return null;
    
    return ms;
}

function formatDuration(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0s';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 1h, 30m, 2d, 10s)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Parse duration
        const duration = parseDuration(durationStr);
        if (!duration) {
            return await interaction.reply({
                content: `${config.emojis.error} Invalid duration format! Use format like: 1h, 30m, 2d, 10s (max 28 days)`,
                ephemeral: true
            });
        }
        
        // Check if user is trying to timeout themselves
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot timeout yourself!`,
                ephemeral: true
            });
        }
        
        // Check if user is trying to timeout the bot
        if (user.id === interaction.client.user.id) {
            return await interaction.reply({
                content: `${config.emojis.error} You cannot timeout me!`,
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
                    content: `${config.emojis.error} You cannot timeout this user due to role hierarchy!`,
                    ephemeral: true
                });
            }
            
            if (!member.moderatable) {
                return await interaction.reply({
                    content: `${config.emojis.error} I cannot timeout this user! Check my permissions and role hierarchy.`,
                    ephemeral: true
                });
            }
            
            // Check if user is already timed out
            if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
                return await interaction.reply({
                    content: `${config.emojis.error} User is already timed out until ${member.communicationDisabledUntil.toLocaleString()}!`,
                    ephemeral: true
                });
            }
            
            // Timeout the user
            await member.timeout(duration, `${reason} | Timed out by ${interaction.user.tag}`);
            
            // Create embed response
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.timeout} User Timed Out`)
                .setColor(config.colors.warning)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${user} (${user.tag})`, inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Ends At', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:F>`, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            await logAction('moderation', {
                action: 'Timeout',
                target: user,
                moderator: interaction.user,
                reason: reason,
                duration: formatDuration(duration)
            });
            
        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to timeout user: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
