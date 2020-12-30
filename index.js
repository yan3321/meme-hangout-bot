require('dotenv-safe').config();
const { Client } = require("discord.js");
const util = require('minecraft-server-util');
const { Rcon } = require('rcon-client');
const dns = require('dns');

const bot = new Client();

const prefix = '!mh ';
const mcHostname = process.env.MH_MINECRAFT_HOSTNAME;
const mcSRV = '_minecraft._tcp.' + mcHostname;

// Refresh interval, in seconds
const refresh_interval = 10;

const colour_green = 65280;
const colour_red = 16711680;

const embedStructure = {
    author: {
        name: 'Minecraft Server Status',
        icon_url: `https://api.mcsrvstat.us/icon/${mcHostname}`,
    },
    color: colour_red,
    fields: [
        {
            name: 'IP',
            value: `\`${mcHostname}\``,
            inline: false,
        },
        {
            name: 'Status',
            value: 'Offline',
            inline: true,
        },
    ],
    timestamp: new Date().toISOString(),
    footer: {
        text: "Refreshes every 10 seconds",
    },
};

function isset(object) {
    if (typeof object !== "undefined" && object !== null) {
        return true;
    }
    return false;
}

async function update() {
    bot.channels
        .fetch(process.env.MH_DISCORD_CHANNEL_ID)
        // Fetch the message
        .then(channel => {
            channel.messages
                .fetch(process.env.MH_DISCORD_MESSAGE_ID)
                .then(msg => {
                    // Create new embed from given structure
                    const embed = JSON.parse(JSON.stringify(embedStructure));
                    const statusField = embed.fields.find(element => element.name === "Status");
                    util.status(mcHostname)
                        .then(status => {
                            const version = status.version;
                            const desc = status.description;
                            const onlinePlayers = status.onlinePlayers;
                            const maxPlayers = status.maxPlayers;
                            const samplePlayers = status.samplePlayers;
                            // Set timestamp
                            embed.timestamp = new Date().toISOString();
                            // Set status info
                            embed.color = colour_green;
                            // Set online status
                            statusField.value = "Online";
                            // Add disclaimer
                            embed.description = `This server is whitelisted; add yourself to the whitelist using \`!mh whitelist add <username>\` \n e.g. \`!mh whitelist add Player1\``;
                            // Add version info
                            if (isset(version)) {
                                embed.fields.push({
                                    name: "Version",
                                    value: version,
                                    inline: true,
                                });
                            }
                            // Add description info
                            if (isset(desc)) {
                                embed.fields.push({
                                    name: "Description",
                                    value: desc,
                                    inline: false,
                                });
                            }
                            // Add players online info
                            if (isset(onlinePlayers) && isset(maxPlayers)) {
                                embed.fields.push({
                                    name: "Players Online",
                                    value: "**" + onlinePlayers + "** / " + maxPlayers,
                                    inline: false,
                                });
                            }
                            let playerListString = "";
                            if (isset(samplePlayers)) {
                                // sort the player list array alphabetically, case-insensitive
                                samplePlayers.sort(function (a, b) {
                                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                                });
                                // add the players to the concatenated string
                                function addToString(playerObject, index) {
                                    playerListString += "• `" + playerObject.name + "`\n";
                                }
                                samplePlayers.forEach(addToString);
                            }
                            // if the player list string isn't empty, add Player List field to the embed
                            if (playerListString !== "") {
                                embed.fields.push({
                                    name: "Player List",
                                    value: playerListString,
                                    inline: false,
                                });
                            }
                            // Edit the message with the new embed
                            msg.edit({ embed });
                        }).catch(err => {
                            // Set timestamp
                            embed.timestamp = new Date().toISOString();
                            // Set status info
                            embed.color = colour_red;
                            // Set online status
                            statusField.value = "Offline";
                            // Edit the message with the new embed
                            msg.edit({ embed });
                            // Log error in console
                            console.log("Error occured obtaining server info: ");
                            console.log(err);
                        });
                }).catch(console.error);
        })
        .catch(console.error);
}

// Start the loop when the bot's up
bot.on("ready", () => {
    bot.user.setActivity(mcHostname, { type: 'WATCHING' })
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);
    update();
    setInterval(update, refresh_interval * 1000);
});

bot.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.channel.send('Pong.');
    } else if (command === 'whitelist') {
        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }
        else {
            if (args[0] === 'list') {
                dns.resolveSrv(mcSRV, async (err, addresses) => {
                    const rcon = await Rcon.connect({
                        host: addresses[0].name, port: 25575, password: process.env.MH_MINECRAFT_RCON_PASSWORD
                    })
                    message.channel.send(`RCON : \`\`\`${await rcon.send(`whitelist list`)}\`\`\``);
                    return rcon.end()
                });
            } else if (args[0] === 'add') {
                if (args[1]) {
                    dns.resolveSrv(mcSRV, async (err, addresses) => {
                        const rcon = await Rcon.connect({
                            host: addresses[0].name, port: 25575, password: process.env.MH_MINECRAFT_RCON_PASSWORD
                        })
                        message.channel.send(`RCON : \`\`\`${await rcon.send(`whitelist add ${args[1]}`)}\`\`\``);
                        return rcon.end();
                    });
                }
            }
        }
    } else if (command === 'args-info') {
        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }
        else if (args[0] === 'foo') {
            return message.channel.send('bar');
        }
        message.channel.send(`First argument: ${args[0]}`);
    }
});

// Login to the bot with the token
bot.login(process.env.MH_DISCORD_BOT_TOKEN);