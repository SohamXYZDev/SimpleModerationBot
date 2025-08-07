const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config.js');

const commands = [];

// Load commands from all folders
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Added command: ${command.data.name} from ${folder}/${file}`);
        } else {
            console.log(`⚠️ Command at ${filePath} is missing "data" or "execute" property.`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// Deploy commands to specific guild
(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands for guild ${config.guildId}.`);

        // Deploy commands to the specific guild only (not global)
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands for guild ${config.guildId}.`);
        console.log(`📋 Commands deployed: ${data.map(cmd => cmd.name).join(', ')}`);
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
