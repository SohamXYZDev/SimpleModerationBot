const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config.js');

async function getCategoryHelp(category, interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setFooter({ 
            text: `Use /help to return to main menu | ${config.botName} v${config.botVersion}`,
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

    switch (category) {
        case 'moderation':
            embed
                .setTitle('🔨 Moderation Commands')
                .setDescription('Complete list of moderation tools and their usage:')
                .addFields(
                    {
                        name: '`/ban <user> [reason] [delete_messages]`',
                        value: 'Permanently ban a user from the server',
                        inline: false
                    },
                    {
                        name: '`/unban <user_id> [reason]`',
                        value: 'Remove a ban using the user ID',
                        inline: false
                    },
                    {
                        name: '`/kick <user> [reason]`',
                        value: 'Remove a user from the server (they can rejoin)',
                        inline: false
                    },
                    {
                        name: '`/timeout <user> <duration> [reason]`',
                        value: 'Temporarily restrict user communication (e.g., 1h, 30m, 2d)',
                        inline: false
                    },
                    {
                        name: '`/untimeout <user> [reason]`',
                        value: 'Remove timeout from a user',
                        inline: false
                    },
                    {
                        name: '`/warn <user> <reason>`',
                        value: 'Issue a warning to a user (sends DM)',
                        inline: false
                    },
                    {
                        name: '`/clear <amount> [user] [reason]`',
                        value: 'Bulk delete messages (up to 100, optional user filter)',
                        inline: false
                    },
                    {
                        name: '`/slowmode <seconds> [reason]`',
                        value: 'Set channel rate limit (0-21600 seconds)',
                        inline: false
                    },
                    {
                        name: '`/lockdown <lock/unlock> [reason]`',
                        value: 'Lock or unlock the current channel',
                        inline: false
                    },
                    {
                        name: '`/banlist [page]`',
                        value: 'View paginated list of banned users',
                        inline: false
                    }
                );
            break;

        case 'utility':
            embed
                .setTitle('📊 Utility Commands')
                .setDescription('Information and diagnostic commands:')
                .addFields(
                    {
                        name: '`/userinfo [user]`',
                        value: 'Get detailed information about a user (roles, join date, timeout status)',
                        inline: false
                    },
                    {
                        name: '`/serverinfo`',
                        value: 'Get comprehensive server statistics and information',
                        inline: false
                    },
                    {
                        name: '`/botinfo`',
                        value: 'Get bot status, uptime, and system information',
                        inline: false
                    },
                    {
                        name: '`/antispam status`',
                        value: 'Show anti-spam system status and settings',
                        inline: false
                    },
                    {
                        name: '`/antispam reset <user>`',
                        value: 'Reset spam detection history for a specific user',
                        inline: false
                    },
                    {
                        name: '`/help [category]`',
                        value: 'Display this help system (you are here!)',
                        inline: false
                    }
                );
            break;

        case 'antispam':
            embed
                .setTitle('🛡️ Anti-Spam Protection System')
                .setDescription('Advanced multi-layered spam detection and prevention:')
                .addFields(
                    {
                        name: '📊 Detection Methods',
                        value: '• **Message Frequency**: 5+ messages in 10 seconds → 7-day timeout\n• **Identical Content**: Same message 3x → 1min (same channel) / 7-day (cross-channel)\n• **Cross-Channel Spam**: Same content in 3+ channels → 7-day timeout\n• **Attachment Spam**: 4+ attachments → 1min (same channel) / 7-day (cross-channel)',
                        inline: false
                    },
                    {
                        name: '🎯 Automatic Actions',
                        value: '• **Smart Timeouts**: Duration based on severity\n• **Message Cleanup**: Up to 10 recent messages deleted server-wide\n• **Comprehensive Logging**: All actions logged with context\n• **Rate Limiting**: 200ms delays to prevent API abuse',
                        inline: false
                    },
                    {
                        name: '⚙️ Smart Features',
                        value: '• **Admin Privileges**: No cooldown for administrators\n• **Bot Immunity**: Ignores bot messages\n• **Auto-Cleanup**: Old tracking data automatically removed\n• **5-Second Cooldown**: Prevents spam detection spam (except admins)',
                        inline: false
                    },
                    {
                        name: '🔧 Configuration',
                        value: 'Configurable via environment variables:\n• `SPAM_MESSAGE_LIMIT` (default: 5)\n• `SPAM_TIME_WINDOW` (default: 10000ms)\n• `AUTO_TIMEOUT_DURATION` (default: 7 days)',
                        inline: false
                    }
                );
            break;

        case 'automod':
            embed
                .setTitle('🤖 Auto-Moderation Features')
                .setDescription('Automated protection and monitoring systems:')
                .addFields(
                    {
                        name: '🔒 Username Protection',
                        value: '• **Anti-Impersonation**: Automatically ban users with banned display names\n• **Real-time Monitoring**: Detects username changes instantly\n• **Configurable Targets**: Set banned usernames via `BANNED_USERNAME`\n• **Immediate Action**: Automatic ban on detection',
                        inline: false
                    },
                    {
                        name: '📝 Event Monitoring',
                        value: '• **Member Join/Leave**: Track and log all member events\n• **Profile Changes**: Monitor username and display name changes\n• **Bulk Message Deletion**: Detect and log potential raids\n• **Message Updates**: Monitor suspicious message edits',
                        inline: false
                    },
                    {
                        name: '⚙️ Configuration Options',
                        value: '• `BANNED_USERNAME`: Username to auto-ban (default: "BD")\n• `BAN_BANNED_USERNAME`: Enable/disable auto-ban (default: true)\n• All actions are logged to the designated logs channel',
                        inline: false
                    },
                    {
                        name: '🛡️ Protection Features',
                        value: '• **Hierarchy Respect**: Won\'t action users with higher roles\n• **Permission Checks**: Validates bot permissions before actions\n• **Error Handling**: Graceful failure with comprehensive logging\n• **Comprehensive Logs**: All auto-mod actions tracked',
                        inline: false
                    }
                );
            break;

        case 'config':
            embed
                .setTitle('⚙️ Configuration & Setup')
                .setDescription('Environment variables and bot configuration:')
                .addFields(
                    {
                        name: '🔑 Required Variables',
                        value: '• `BOT_TOKEN`: Discord bot token\n• `CLIENT_ID`: Discord application client ID\n• `GUILD_ID`: Target server ID',
                        inline: false
                    },
                    {
                        name: '🎨 Bot Identity',
                        value: '• `BOT_NAME`: Display name (default: "Moderation Bot")\n• `BOT_AUTHOR`: Creator name\n• `BOT_ACTIVITY`: Activity status text (default: "for violations")\n• `BOT_VERSION`: Version number',
                        inline: false
                    },
                    {
                        name: '🛡️ Anti-Spam Settings',
                        value: '• `SPAM_MESSAGE_LIMIT`: Messages before detection (default: 5)\n• `SPAM_TIME_WINDOW`: Time window in ms (default: 10000)\n• `AUTO_TIMEOUT_DURATION`: Timeout duration in ms (default: 7 days)',
                        inline: false
                    },
                    {
                        name: '🔒 Auto-Moderation',
                        value: '• `BANNED_USERNAME`: Username to auto-ban (default: "BD")\n• `BAN_BANNED_USERNAME`: Enable auto-ban (default: true)\n• `LOGS_CHANNEL`: Logs channel name (default: "logs")',
                        inline: false
                    },
                    {
                        name: '🔧 Bot Permissions Required',
                        value: 'View Channels, Send Messages, Manage Messages, Embed Links, Read Message History, Moderate Members, Ban Members, Kick Members, Manage Channels, Manage Roles',
                        inline: false
                    }
                );
            break;

        default:
            embed
                .setTitle(`${config.emojis.error} Unknown Category`)
                .setDescription('The requested help category was not found. Use `/help` without options to see all available categories.');
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with bot commands and features')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Choose a specific help category')
                .setRequired(false)
                .addChoices(
                    { name: 'Moderation Commands', value: 'moderation' },
                    { name: 'Utility Commands', value: 'utility' },
                    { name: 'Anti-Spam System', value: 'antispam' },
                    { name: 'Auto-Moderation', value: 'automod' },
                    { name: 'Configuration', value: 'config' }
                )),

    async execute(interaction) {
        const category = interaction.options.getString('category');

        try {
            if (!category) {
                // Main help embed with category selection
                const mainEmbed = new EmbedBuilder()
                    .setTitle(`${config.emojis.info} ${config.botName} Help Center`)
                    .setDescription(`Welcome to the **${config.botName}** help system! Select a category below to get detailed information about specific features.`)
                    .setColor(config.colors.info)
                    .addFields(
                        {
                            name: '🔨 Moderation Commands',
                            value: 'Ban, kick, timeout, warn, clear messages, and more',
                            inline: true
                        },
                        {
                            name: '📊 Utility Commands',
                            value: 'User info, server info, bot status, and diagnostics',
                            inline: true
                        },
                        {
                            name: '🛡️ Anti-Spam System',
                            value: 'Automated spam detection and prevention',
                            inline: true
                        },
                        {
                            name: '🤖 Auto-Moderation',
                            value: 'Automated username filtering and protection',
                            inline: true
                        },
                        {
                            name: '⚙️ Configuration',
                            value: 'Environment variables and bot settings',
                            inline: true
                        },
                        {
                            name: '📝 Quick Start',
                            value: 'Use `/help <category>` or select from the dropdown below',
                            inline: true
                        }
                    )
                    .setFooter({ 
                        text: `${config.botName} v${config.botVersion} | Made by ${config.botAuthor}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Create dropdown menu for category selection
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('help_category_select')
                    .setPlaceholder('Select a help category...')
                    .addOptions([
                        {
                            label: 'Moderation Commands',
                            description: 'Ban, kick, timeout, warn, and other moderation tools',
                            value: 'moderation',
                            emoji: '🔨'
                        },
                        {
                            label: 'Utility Commands',
                            description: 'Information and diagnostic commands',
                            value: 'utility',
                            emoji: '📊'
                        },
                        {
                            label: 'Anti-Spam System',
                            description: 'Learn about spam detection and prevention',
                            value: 'antispam',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Auto-Moderation',
                            description: 'Automated moderation features',
                            value: 'automod',
                            emoji: '🤖'
                        },
                        {
                            label: 'Configuration',
                            description: 'Bot settings and environment variables',
                            value: 'config',
                            emoji: '⚙️'
                        }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({ 
                    embeds: [mainEmbed], 
                    components: [row],
                    ephemeral: true 
                });

            } else {
                // Category-specific help
                const embed = await getCategoryHelp(category, interaction);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to display help information: ${error.message}`,
                ephemeral: true
            });
        }
    },
};

async function getCategoryHelp(category, interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setFooter({ 
            text: `Use /help to return to main menu | ${config.botName} v${config.botVersion}`,
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

    switch (category) {
        case 'moderation':
            embed
                .setTitle('🔨 Moderation Commands')
                .setDescription('Complete list of moderation tools and their usage:')
                .addFields(
                    {
                        name: '`/ban <user> [reason] [delete_messages]`',
                        value: 'Permanently ban a user from the server',
                        inline: false
                    },
                    {
                        name: '`/unban <user_id> [reason]`',
                        value: 'Remove a ban using the user ID',
                        inline: false
                    },
                    {
                        name: '`/kick <user> [reason]`',
                        value: 'Remove a user from the server (they can rejoin)',
                        inline: false
                    },
                    {
                        name: '`/timeout <user> <duration> [reason]`',
                        value: 'Temporarily restrict user communication (e.g., 1h, 30m, 2d)',
                        inline: false
                    },
                    {
                        name: '`/untimeout <user> [reason]`',
                        value: 'Remove timeout from a user',
                        inline: false
                    },
                    {
                        name: '`/warn <user> <reason>`',
                        value: 'Issue a warning to a user (sends DM)',
                        inline: false
                    },
                    {
                        name: '`/clear <amount> [user] [reason]`',
                        value: 'Bulk delete messages (up to 100, optional user filter)',
                        inline: false
                    },
                    {
                        name: '`/slowmode <seconds> [reason]`',
                        value: 'Set channel rate limit (0-21600 seconds)',
                        inline: false
                    },
                    {
                        name: '`/lockdown <lock/unlock> [reason]`',
                        value: 'Lock or unlock the current channel',
                        inline: false
                    },
                    {
                        name: '`/banlist [page]`',
                        value: 'View paginated list of banned users',
                        inline: false
                    }
                );
            break;

        case 'utility':
            embed
                .setTitle('📊 Utility Commands')
                .setDescription('Information and diagnostic commands:')
                .addFields(
                    {
                        name: '`/userinfo [user]`',
                        value: 'Get detailed information about a user (roles, join date, timeout status)',
                        inline: false
                    },
                    {
                        name: '`/serverinfo`',
                        value: 'Get comprehensive server statistics and information',
                        inline: false
                    },
                    {
                        name: '`/botinfo`',
                        value: 'Get bot status, uptime, and system information',
                        inline: false
                    },
                    {
                        name: '`/antispam status`',
                        value: 'Show anti-spam system status and settings',
                        inline: false
                    },
                    {
                        name: '`/antispam reset <user>`',
                        value: 'Reset spam detection history for a specific user',
                        inline: false
                    },
                    {
                        name: '`/help [category]`',
                        value: 'Display this help system (you are here!)',
                        inline: false
                    }
                );
            break;

        case 'antispam':
            embed
                .setTitle('🛡️ Anti-Spam Protection System')
                .setDescription('Advanced multi-layered spam detection and prevention:')
                .addFields(
                    {
                        name: '📊 Detection Methods',
                        value: '• **Message Frequency**: 5+ messages in 10 seconds → 7-day timeout\n• **Identical Content**: Same message 3x → 1min (same channel) / 7-day (cross-channel)\n• **Cross-Channel Spam**: Same content in 3+ channels → 7-day timeout\n• **Attachment Spam**: 4+ attachments → 1min (same channel) / 7-day (cross-channel)',
                        inline: false
                    },
                    {
                        name: '🎯 Automatic Actions',
                        value: '• **Smart Timeouts**: Duration based on severity\n• **Message Cleanup**: Up to 10 recent messages deleted server-wide\n• **Comprehensive Logging**: All actions logged with context\n• **Rate Limiting**: 200ms delays to prevent API abuse',
                        inline: false
                    },
                    {
                        name: '⚙️ Smart Features',
                        value: '• **Admin Privileges**: No cooldown for administrators\n• **Bot Immunity**: Ignores bot messages\n• **Auto-Cleanup**: Old tracking data automatically removed\n• **5-Second Cooldown**: Prevents spam detection spam (except admins)',
                        inline: false
                    },
                    {
                        name: '🔧 Configuration',
                        value: 'Configurable via environment variables:\n• `SPAM_MESSAGE_LIMIT` (default: 5)\n• `SPAM_TIME_WINDOW` (default: 10000ms)\n• `AUTO_TIMEOUT_DURATION` (default: 7 days)',
                        inline: false
                    }
                );
            break;

        case 'automod':
            embed
                .setTitle('🤖 Auto-Moderation Features')
                .setDescription('Automated protection and monitoring systems:')
                .addFields(
                    {
                        name: '🔒 Username Protection',
                        value: '• **Anti-Impersonation**: Automatically ban users with banned display names\n• **Real-time Monitoring**: Detects username changes instantly\n• **Configurable Targets**: Set banned usernames via `BANNED_USERNAME`\n• **Immediate Action**: Automatic ban on detection',
                        inline: false
                    },
                    {
                        name: '📝 Event Monitoring',
                        value: '• **Member Join/Leave**: Track and log all member events\n• **Profile Changes**: Monitor username and display name changes\n• **Bulk Message Deletion**: Detect and log potential raids\n• **Message Updates**: Monitor suspicious message edits',
                        inline: false
                    },
                    {
                        name: '⚙️ Configuration Options',
                        value: '• `BANNED_USERNAME`: Username to auto-ban (default: "BD")\n• `BAN_BANNED_USERNAME`: Enable/disable auto-ban (default: true)\n• All actions are logged to the designated logs channel',
                        inline: false
                    },
                    {
                        name: '🛡️ Protection Features',
                        value: '• **Hierarchy Respect**: Won\'t action users with higher roles\n• **Permission Checks**: Validates bot permissions before actions\n• **Error Handling**: Graceful failure with comprehensive logging\n• **Comprehensive Logs**: All auto-mod actions tracked',
                        inline: false
                    }
                );
            break;

        case 'config':
            embed
                .setTitle('⚙️ Configuration & Setup')
                .setDescription('Environment variables and bot configuration:')
                .addFields(
                    {
                        name: '🔑 Required Variables',
                        value: '• `BOT_TOKEN`: Discord bot token\n• `CLIENT_ID`: Discord application client ID\n• `GUILD_ID`: Target server ID',
                        inline: false
                    },
                    {
                        name: '🎨 Bot Identity',
                        value: '• `BOT_NAME`: Display name (default: "Moderation Bot")\n• `BOT_AUTHOR`: Creator name\n• `BOT_ACTIVITY`: Activity status text (default: "for violations")\n• `BOT_VERSION`: Version number',
                        inline: false
                    },
                    {
                        name: '🛡️ Anti-Spam Settings',
                        value: '• `SPAM_MESSAGE_LIMIT`: Messages before detection (default: 5)\n• `SPAM_TIME_WINDOW`: Time window in ms (default: 10000)\n• `AUTO_TIMEOUT_DURATION`: Timeout duration in ms (default: 7 days)',
                        inline: false
                    },
                    {
                        name: '🔒 Auto-Moderation',
                        value: '• `BANNED_USERNAME`: Username to auto-ban (default: "BD")\n• `BAN_BANNED_USERNAME`: Enable auto-ban (default: true)\n• `LOGS_CHANNEL`: Logs channel name (default: "logs")',
                        inline: false
                    },
                    {
                        name: '🔧 Bot Permissions Required',
                        value: 'View Channels, Send Messages, Manage Messages, Embed Links, Read Message History, Moderate Members, Ban Members, Kick Members, Manage Channels, Manage Roles',
                        inline: false
                    }
                );
            break;

        default:
            embed
                .setTitle(`${config.emojis.error} Unknown Category`)
                .setDescription('The requested help category was not found. Use `/help` without options to see all available categories.');
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with bot commands and features')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Choose a specific help category')
                .setRequired(false)
                .addChoices(
                    { name: 'Moderation Commands', value: 'moderation' },
                    { name: 'Utility Commands', value: 'utility' },
                    { name: 'Anti-Spam System', value: 'antispam' },
                    { name: 'Auto-Moderation', value: 'automod' },
                    { name: 'Configuration', value: 'config' }
                )),

    async execute(interaction) {
        const category = interaction.options.getString('category');

        try {
            if (!category) {
                // Main help embed with category selection
                const mainEmbed = new EmbedBuilder()
                    .setTitle(`${config.emojis.info} ${config.botName} Help Center`)
                    .setDescription(`Welcome to the **${config.botName}** help system! Select a category below to get detailed information about specific features.`)
                    .setColor(config.colors.info)
                    .addFields(
                        {
                            name: '🔨 Moderation Commands',
                            value: 'Ban, kick, timeout, warn, clear messages, and more',
                            inline: true
                        },
                        {
                            name: '📊 Utility Commands',
                            value: 'User info, server info, bot status, and diagnostics',
                            inline: true
                        },
                        {
                            name: '🛡️ Anti-Spam System',
                            value: 'Automated spam detection and prevention',
                            inline: true
                        },
                        {
                            name: '🤖 Auto-Moderation',
                            value: 'Automated username filtering and protection',
                            inline: true
                        },
                        {
                            name: '⚙️ Configuration',
                            value: 'Environment variables and bot settings',
                            inline: true
                        },
                        {
                            name: '📝 Quick Start',
                            value: 'Use `/help <category>` or select from the dropdown below',
                            inline: true
                        }
                    )
                    .setFooter({ 
                        text: `${config.botName} v${config.botVersion} | Made by ${config.botAuthor}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Create dropdown menu for category selection
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('help_category_select')
                    .setPlaceholder('Select a help category...')
                    .addOptions([
                        {
                            label: 'Moderation Commands',
                            description: 'Ban, kick, timeout, warn, and other moderation tools',
                            value: 'moderation',
                            emoji: '🔨'
                        },
                        {
                            label: 'Utility Commands',
                            description: 'Information and diagnostic commands',
                            value: 'utility',
                            emoji: '📊'
                        },
                        {
                            label: 'Anti-Spam System',
                            description: 'Learn about spam detection and prevention',
                            value: 'antispam',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Auto-Moderation',
                            description: 'Automated moderation features',
                            value: 'automod',
                            emoji: '🤖'
                        },
                        {
                            label: 'Configuration',
                            description: 'Bot settings and environment variables',
                            value: 'config',
                            emoji: '⚙️'
                        }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({ 
                    embeds: [mainEmbed], 
                    components: [row],
                    ephemeral: true 
                });

            } else {
                // Category-specific help
                const embed = await getCategoryHelp(category, interaction);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({
                content: `${config.emojis.error} Failed to display help information: ${error.message}`,
                ephemeral: true
            });
        }
    },
    
    getCategoryHelp // Export the helper function
};
