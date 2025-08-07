const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamtest')
        .setDescription('Test the anti-spam system (Admin only)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of spam test to run')
                .setRequired(true)
                .addChoices(
                    { name: 'Message Frequency', value: 'frequency' },
                    { name: 'Identical Content', value: 'identical' },
                    { name: 'Cross Channel', value: 'cross_channel' },
                    { name: 'Show Settings', value: 'settings' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const testType = interaction.options.getString('type');
        
        if (testType === 'settings') {
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.info} Anti-Spam Settings`)
                .setColor(config.colors.info)
                .addFields(
                    { name: 'Message Limit', value: `${config.spam.messageLimit} messages`, inline: true },
                    { name: 'Time Window', value: `${config.spam.timeWindow / 1000} seconds`, inline: true },
                    { name: 'Timeout Duration', value: `${config.spam.timeoutDuration / (24 * 60 * 60 * 1000)} days`, inline: true },
                    { name: 'Test Instructions', value: 'To test spam detection:\n• **Frequency**: Send 5+ messages quickly\n• **Identical**: Send same message 3 times\n• **Cross-Channel**: Send same message in 3+ channels\n• **Attachment**: Upload 4+ images/files', inline: false },
                    { name: 'Note', value: '⚠️ Anti-spam now works on **everyone** including admins!', inline: false }
                )
                .setTimestamp();
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${config.emojis.warning} Spam Test: ${testType}`)
            .setColor(config.colors.warning)
            .setDescription('**How to test:**')
            .setTimestamp();
        
        switch (testType) {
            case 'frequency':
                embed.addFields({
                    name: 'Message Frequency Test',
                    value: `Send ${config.spam.messageLimit} or more messages within ${config.spam.timeWindow / 1000} seconds to trigger spam detection.`,
                    inline: false
                });
                break;
                
            case 'identical':
                embed.addFields({
                    name: 'Identical Content Test',
                    value: 'Send the same message 3 times in a row to trigger identical content spam detection.',
                    inline: false
                });
                break;
                
            case 'cross_channel':
                embed.addFields({
                    name: 'Cross-Channel Test',
                    value: 'Send the same message in 3 different channels to trigger cross-channel spam detection.',
                    inline: false
                });
                break;
        }
        
        embed.addFields({
            name: 'Expected Result',
            value: '• Up to 10 recent messages (15 min) will be bulk deleted across ALL channels\n• User will be timed out (if possible)\n• Action will be logged\n• 5 second cooldown before next detection (no cooldown for admins)',
            inline: false
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
