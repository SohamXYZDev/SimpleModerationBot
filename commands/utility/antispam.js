const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { resetUserSpamHistory } = require('../../utils/antiSpam.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antispam')
        .setDescription('Manage anti-spam settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show anti-spam system status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset spam history for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset spam history for')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            if (subcommand === 'status') {
                const embed = new EmbedBuilder()
                    .setTitle(`${config.emojis.info} Anti-Spam System Status`)
                    .setColor(config.colors.info)
                    .addFields(
                        { name: 'Status', value: '🟢 Active', inline: true },
                        { name: 'Message Limit', value: `${config.spam.messageLimit} messages`, inline: true },
                        { name: 'Time Window', value: `${config.spam.timeWindow / 1000} seconds`, inline: true },
                        { name: 'Auto-Timeout Duration', value: `${config.spam.timeoutDuration / (24 * 60 * 60 * 1000)} days`, inline: true },
                        { name: 'Protected Features', value: '• Message frequency detection\n• Identical content spam\n• Cross-channel spam\n• Attachment spam\n• Auto-timeout violators', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `${config.botName} v${config.botVersion}` });
                
                await interaction.reply({ embeds: [embed] });
                
            } else if (subcommand === 'reset') {
                const user = interaction.options.getUser('user');
                
                // Reset spam history for the user
                resetUserSpamHistory(user.id);
                
                const embed = new EmbedBuilder()
                    .setTitle(`${config.emojis.success} Spam History Reset`)
                    .setColor(config.colors.success)
                    .addFields(
                        { name: 'User', value: `${user} (${user.tag})`, inline: true },
                        { name: 'Moderator', value: `${interaction.user}`, inline: true },
                        { name: 'Action', value: 'Spam detection history cleared', inline: false }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                
                console.log(`🔄 Spam history reset for ${user.tag} by ${interaction.user.tag}`);
            }
            
        } catch (error) {
            console.error('Error in antispam command:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to execute anti-spam command: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
