const { Events, ActivityType } = require('discord.js');
const config = require('../config.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ ${config.botName} is online!`);
        console.log(`🤖 Logged in as ${client.user.tag}`);
        console.log(`🏠 Serving guild: ${config.guildId}`);
        console.log(`📊 Loaded ${client.commands.size} commands`);
        
        // Set bot activity using configurable text
        client.user.setActivity({
            name: config.botActivity,
            type: ActivityType.Watching
        });
        
        // Log startup
        const guild = client.guilds.cache.get(config.guildId);
        if (guild) {
            console.log(`🎯 Connected to guild: ${guild.name} (${guild.memberCount} members)`);
            console.log(`👀 Activity set: Watching ${config.botActivity}`);
        }
    },
};
