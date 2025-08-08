const { Events } = require('discord.js');
const { logAction, logCommand } = require('../utils/logger.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`❌ No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            try {
                console.log(`📝 ${interaction.user.tag} used /${interaction.commandName} in #${interaction.channel.name}`);
                await command.execute(interaction);
                await logCommand(interaction, interaction.commandName, true);
            } catch (error) {
                console.error(`❌ Error executing ${interaction.commandName}:`, error);
                await logCommand(interaction, interaction.commandName, false, error);
                
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    ephemeral: true
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            // Handle custom button interactions here if needed
            console.log(`🔘 ${interaction.user.tag} clicked button: ${interaction.customId}`);
        }
        
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            console.log(`📋 ${interaction.user.tag} used select menu: ${interaction.customId}`);
            
            // Handle help category selection
            if (interaction.customId === 'help_category_select') {
                const selectedCategory = interaction.values[0];
                
                try {
                    // Import the help command module to use its helper function
                    const { getCategoryHelp } = require('../commands/utility/help.js');
                    
                    // Get the category help embed
                    const embed = await getCategoryHelp(selectedCategory, interaction);
                    
                    await interaction.reply({ embeds: [embed] });
                    
                } catch (error) {
                    console.error('Error handling help category selection:', error);
                    await interaction.reply({
                        content: '❌ Failed to load help category information.'
                    });
                }
            }
        }
    },
};
