# A Simple (Yet Profound) Moderation Discord Bot

---

An advanced Discord moderation bot with comprehensive anti-spam protection, auto-moderation features, and detailed logging capabilities.

---

Made by (SohamXYZ)[www.sohamxyz.com]

## Features

### 🔨 Basic Moderation Commands

- **Ban/Unban** - Ban or unban users with reasons and message deletion options
- **Kick** - Remove users from the server
- **Timeout/Untimeout** - Temporarily restrict user communication
- **Warn** - Issue warnings to users with DM notifications
- **Clear** - Bulk delete messages with optional user filtering
- **Slowmode** - Set channel rate limits
- **Lockdown** - Lock/unlock channels quickly
- **Ban List** - View paginated list of banned users

### 🛡️ Anti-Spam Protection

- **Message Frequency Detection** - Automatically timeout users sending too many messages (7-day timeout)
- **Identical Content Spam** - Detect repeated messages (1-minute timeout for same channel, 7-day for cross-channel)
- **Cross-Channel Spam** - Identify users spamming the same content across multiple channels (7-day timeout)
- **Attachment Spam** - Monitor excessive attachment/image uploads (1-minute timeout for same channel, 7-day for cross-channel)
- **Smart Message Cleanup** - Automatically deletes last 5 messages from violators

### 🤖 Auto-Moderation

- **Anti Owner-Impersonation Filter** - Automatically ban users with configurable banned display names (Anti-Impersonation)
- **Real-time Monitoring** - Detect username changes to display names and take immediate action
- **Comprehensive Logging** - Log all moderation actions and auto-mod triggers

### 📊 Utility Commands

- **User Info** - Detailed user information with roles, join dates, and timeout status
- **Server Info** - Comprehensive server statistics and information
- **Bot Info** - Bot status, uptime, and system information
- **Anti-Spam Status** - Monitor and manage anti-spam system settings

### 📝 Logging System

- **Dedicated Logs Channel** - All actions logged to a configurable channel
- **Detailed Embeds** - Rich embed logging with timestamps and context
- **Error Tracking** - Automatic error logging and monitoring
- **Member Events** - Track joins, leaves, and profile changes

## Setup Instructions

### Prerequisites

- Node.js v16.9.0 or higher
- A Discord Bot Token
- Discord Application with bot permissions

### Installation

1. **Clone or download this bot to your server**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   - Copy `.env.example` to `.env`
   - Fill in your bot credentials:

   ```env
   BOT_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here

   # Optional: Customize bot identity
   BOT_NAME=Moderation Bot
   BOT_AUTHOR=Your Name Here
   ```

4. **Deploy Commands to Your Guild**

   ```bash
   npm run deploy
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

### Bot Permissions Required

The bot needs the following permissions to function properly:

- View Channels
- Send Messages
- Manage Messages
- Embed Links
- Read Message History
- Moderate Members (Timeout)
- Ban Members
- Kick Members
- Manage Channels
- Manage Roles (for lockdown)

### Invite Link

Generate an invite link with these permissions using the Discord Developer Portal or use this permission integer: `1099511627776`

## Configuration

### Environment Variables

| Variable                | Description                         | Default            |
| ----------------------- | ----------------------------------- | ------------------ |
| `BOT_TOKEN`             | Discord bot token                   | Required           |
| `CLIENT_ID`             | Discord application client ID       | Required           |
| `GUILD_ID`              | Target guild/server ID              | Required           |
| `BOT_NAME`              | Display name for the bot            | Moderation Bot     |
| `BOT_AUTHOR`            | Bot creator name                    | -                  |
| `LOGS_CHANNEL`          | Name of logs channel                | logs               |
| `SPAM_MESSAGE_LIMIT`    | Messages before spam detection      | 5                  |
| `SPAM_TIME_WINDOW`      | Time window for spam detection (ms) | 10000              |
| `AUTO_TIMEOUT_DURATION` | Auto-timeout duration (ms)          | 604800000 (7 days) |
| `BANNED_USERNAME`       | Username to auto-ban                | Owner              |
| `BAN_BANNED_USERNAME`   | Enable auto-ban for banned username | true               |

### Anti-Spam Settings

The anti-spam system can be configured through environment variables:

- **Message Limit**: Number of messages in time window before action
- **Time Window**: Time period to monitor (milliseconds)
- **Timeout Duration**: How long to timeout violators

## Commands

### Moderation Commands

- `/ban <user> [reason] [delete_messages]` - Ban a user
- `/unban <user_id> [reason]` - Unban a user by ID
- `/kick <user> [reason]` - Kick a user
- `/timeout <user> <duration> [reason]` - Timeout a user (e.g., 1h, 30m, 2d)
- `/untimeout <user> [reason]` - Remove timeout from a user
- `/warn <user> <reason>` - Issue a warning
- `/clear <amount> [user] [reason]` - Delete messages
- `/slowmode <seconds> [reason]` - Set channel slowmode
- `/lockdown lock/unlock [reason]` - Lock or unlock channel
- `/banlist [page]` - View banned users

### Utility Commands

- `/userinfo [user]` - Get user information
- `/serverinfo` - Get server information
- `/botinfo` - Get bot information
- `/antispam status/reset` - Manage anti-spam system

## File Structure

```
SimpleModerationBot/
├── commands/
│   ├── moderation/          # Moderation commands
│   │   ├── ban.js
│   │   ├── unban.js
│   │   ├── kick.js
│   │   ├── timeout.js
│   │   ├── untimeout.js
│   │   ├── warn.js
│   │   ├── clear.js
│   │   ├── slowmode.js
│   │   ├── lockdown.js
│   │   └── banlist.js
│   └── utility/             # Utility commands
│       ├── userinfo.js
│       ├── serverinfo.js
│       ├── botinfo.js
│       └── antispam.js
├── events/                  # Event handlers
│   ├── ready.js
│   └── interactionCreate.js
├── utils/                   # Utility modules
│   ├── logger.js           # Logging system
│   ├── antiSpam.js         # Anti-spam protection
│   └── autoModeration.js   # Auto-moderation features
├── config.js               # Bot configuration
├── index.js                # Main bot file
├── deploy-commands.js      # Guild command deployment
├── package.json
├── .env                    # Environment variables
├── .env.example           # Environment template
└── README.md              # This file
```

## Security Features

### Identity Protection

- All bot identity information is stored in environment variables
- Easy to recycle by copying files and swapping `.env`
- No hardcoded tokens or sensitive information

### Permission Checks

- Hierarchy validation for all moderation commands
- Permission verification before executing actions
- Protection against self-targeting and bot-targeting

### Error Handling

- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages

## Auto-Moderation Features

### Banned Username Detection

- Anti-Impersonation of Owner
- Automatically detects users with configurable banned usernames
- Applies ban immediately upon detection
- Monitors username changes in real-time
- Logs all actions for review

### Anti-Spam Protection

- **Multi-layered Detection**:
  - Message frequency (5 messages in 10 seconds) → 7-day timeout
  - Identical content repetition → 1-minute timeout (same channel) / 7-day timeout (cross-channel)
  - Cross-channel spam patterns → 7-day timeout
  - Attachment/media spam → 1-minute timeout (same channel) / 7-day timeout (cross-channel)
- **Automatic Response**:
  - Smart timeout durations (1 minute or 7 days based on severity)
  - Always deletes last 5 messages from violator
  - Comprehensive logging with context
- **Smart Filtering**:
  - Ignores bot messages
  - Skips users with moderation permissions
  - Cleans up old tracking data

## Logging

The bot automatically creates a logs channel and records:

- All moderation actions
- Auto-moderation triggers
- Member join/leave events
- Error occurrences
- Command usage

## Support and Maintenance

### Development Mode

```bash
npm run dev  # Uses nodemon for auto-restart
```

### Monitoring

- Check logs channel for bot activity
- Monitor console output for errors
- Use `/botinfo` command for system status

### Updates

To update the bot:

1. Replace all files except `.env`
2. Run `npm install` to update dependencies
3. Run `npm run deploy` to update commands
4. Restart the bot

## License

This project is licensed under the MIT License - see the package.json file for details.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the bot.

---

**Note**: This bot is designed for guild-specific deployment. Commands are deployed per-guild, not globally, for better performance and control.
