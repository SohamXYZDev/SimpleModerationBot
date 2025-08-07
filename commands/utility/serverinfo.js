const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),
    
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            
            // Fetch additional guild data
            const owner = await guild.fetchOwner();
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;
            
            // Count different channel types
            const textChannels = channels.filter(c => c.type === 0).size;
            const voiceChannels = channels.filter(c => c.type === 2).size;
            const categories = channels.filter(c => c.type === 4).size;
            
            // Get verification level text
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };
            
            // Get boost information
            const boostTier = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;
            
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.info} Server Information`)
                .setColor(config.colors.info)
                .setThumbnail(guild.iconURL({ size: 256 }))
                .addFields(
                    { name: 'Server Name', value: guild.name, inline: true },
                    { name: 'Server ID', value: guild.id, inline: true },
                    { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                    { name: 'Members', value: `${guild.memberCount}`, inline: true },
                    { name: 'Roles', value: `${roles.size}`, inline: true },
                    { name: 'Channels', value: `${channels.size} total\n📝 ${textChannels} Text\n🔊 ${voiceChannels} Voice\n📁 ${categories} Categories`, inline: true },
                    { name: 'Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
                    { name: 'Boost Status', value: `Tier ${boostTier}\n${boostCount} boosts`, inline: true }
                );
            
            // Add description if exists
            if (guild.description) {
                embed.addFields({ name: 'Description', value: guild.description, inline: false });
            }
            
            // Add features if any
            if (guild.features.length > 0) {
                const features = guild.features.map(feature => 
                    feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                ).join(', ');
                embed.addFields({ name: 'Features', value: features, inline: false });
            }
            
            // Add banner if exists
            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ size: 512 }));
            }
            
            embed.setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting server info:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to get server information: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
