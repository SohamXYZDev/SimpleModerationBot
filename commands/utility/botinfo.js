const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Get information about the bot'),
    
    async execute(interaction) {
        try {
            const client = interaction.client;
            const uptime = process.uptime();
            
            // Calculate uptime
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
            // Get memory usage
            const memUsage = process.memoryUsage();
            const memUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
            const memTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
            
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.info} Bot Information`)
                .setColor(config.colors.info)
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: 'Bot Name', value: config.botName, inline: true },
                    { name: 'Version', value: config.botVersion, inline: true },
                    { name: 'Author', value: config.botAuthor || 'Not specified', inline: true },
                    { name: 'Uptime', value: uptimeString, inline: true },
                    { name: 'Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                    { name: 'Memory Usage', value: `${memUsed}MB / ${memTotal}MB`, inline: true },
                    { name: 'Commands Loaded', value: `${client.commands.size}`, inline: true },
                    { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Node.js Version', value: process.version, inline: true },
                    { name: 'Discord.js Version', value: require('discord.js').version, inline: true }
                )
                .addFields({
                    name: 'Features',
                    value: '• Advanced moderation commands\n• Anti-spam protection\n• Auto-moderation for BD usernames\n• Comprehensive logging\n• Cross-channel spam detection\n• Automatic timeout system',
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: `Bot ID: ${client.user.id}` });
            
            // Add guild-specific info if available
            const guild = client.guilds.cache.get(config.guildId);
            if (guild) {
                embed.addFields({ name: 'Current Server', value: guild.name, inline: true });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting bot info:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to get bot information: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
