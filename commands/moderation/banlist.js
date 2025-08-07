const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Show the server ban list')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const page = interaction.options.getInteger('page') || 1;
        const bansPerPage = 10;
        
        try {
            await interaction.deferReply();
            
            const bans = await interaction.guild.bans.fetch();
            
            if (bans.size === 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`${config.emojis.info} Ban List`)
                    .setColor(config.colors.info)
                    .setDescription('No banned users found.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const totalPages = Math.ceil(bans.size / bansPerPage);
            
            if (page > totalPages) {
                return await interaction.editReply({
                    content: `${config.emojis.error} Page ${page} not found. Total pages: ${totalPages}`,
                    ephemeral: true
                });
            }
            
            const startIndex = (page - 1) * bansPerPage;
            const endIndex = startIndex + bansPerPage;
            const banArray = Array.from(bans.values()).slice(startIndex, endIndex);
            
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.ban} Ban List - Page ${page}/${totalPages}`)
                .setColor(config.colors.error)
                .setDescription(`Total banned users: ${bans.size}`)
                .setTimestamp()
                .setFooter({ text: `${config.botName} v${config.botVersion}` });
            
            for (const ban of banArray) {
                const user = ban.user;
                const reason = ban.reason || 'No reason provided';
                
                embed.addFields({
                    name: `${user.tag} (${user.id})`,
                    value: `**Reason:** ${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}`,
                    inline: false
                });
            }
            
            if (totalPages > 1) {
                embed.addFields({
                    name: 'Navigation',
                    value: `Use \`/banlist page:${page + 1}\` for next page${page > 1 ? `\nUse \`/banlist page:${page - 1}\` for previous page` : ''}`,
                    inline: false
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching ban list:', error);
            
            const errorMessage = `${config.emojis.error} Failed to fetch ban list: ${error.message}`;
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
