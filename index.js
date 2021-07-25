require("dotenv-safe").config();
const { Client, TextChannel } = require("discord.js");
const util = require("minecraft-server-util");
const { Rcon } = require("rcon-client");
const dns = require("dns").promises;

const bot = new Client();

const prefix = "!mh ";
const mcHostname = process.env.MH_MINECRAFT_HOSTNAME;
const mcSRV = `_minecraft._tcp.${mcHostname}`;

const channelId = process.env.MH_DISCORD_CHANNEL_ID;
const messageId = process.env.MH_DISCORD_MESSAGE_ID;

// Refresh interval, in seconds
const refresh_interval = 10;

const colour_green = 65280;
const colour_red = 16711680;

const embedStructure = {
  author: {
    name: "Minecraft Server Status",
    icon_url: `https://api.mcsrvstat.us/icon/${mcHostname}`,
  },
  color: colour_red,
  fields: [
    {
      name: "IP",
      value: `\`${mcHostname}\``,
      inline: false,
    },
    {
      name: "Status",
      value: "Offline",
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

async function getChannel() {
  const channel = await bot.channels.fetch(channelId);
  if (channel instanceof TextChannel) {
    return channel;
  } else {
    throw new Error("not a text channel");
  }
}

async function update() {
  const channel = await getChannel();
  const message = await channel.messages.fetch(messageId);
  // Create new embed from given structure
  const embed = JSON.parse(JSON.stringify(embedStructure));
  const statusField = embed.fields.find((element) => element.name === "Status");
  try {
    const status = await util.status(mcHostname);

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
    message.edit({ embed });
  } catch (error) {
    console.error(error);
    // Set timestamp
    embed.timestamp = new Date().toISOString();
    // Set status info
    embed.color = colour_red;
    // Set online status
    statusField.value = "Offline";
    // Edit the message with the new embed
    message.edit({ embed });
  }
}

let host = "";

async function runRCON(command) {
  if (host === "") {
    const addresses = await dns.resolveSrv(mcSRV);
    host = addresses[0].name;
  }
  const rcon = await Rcon.connect({
    host: host,
    port: 25575,
    password: process.env.MH_MINECRAFT_RCON_PASSWORD,
  });
  const result = await rcon.send(command);
  console.log(result);
  await rcon.end();
  return result;
}

// Start the loop when the bot's up
bot.on("ready", () => {
  bot.user
    .setActivity(mcHostname, { type: "WATCHING" })
    .then((presence) =>
      console.log(`Activity set to ${presence.activities[0].name}`)
    )
    .catch(console.error);
  update();
  setInterval(update, refresh_interval * 1000);
});

bot.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    message.channel.send("Pong.");
  } else if (command === "whitelist") {
    if (!args.length) {
      return message.channel.send(
        `You didn't provide any arguments, ${message.author}!`
      );
    } else {
      const whitelist_cmd = args[0];
      const target = args[1];

      let rcon_cmd = null;

      switch (whitelist_cmd) {
        case "list":
          rcon_cmd = `whitelist list`;
          break;
        case "add":
          rcon_cmd = `whitelist add ${target}`;
          break;
        case "remove":
          rcon_cmd = `whitelist remove ${target}`;
          break;
        default:
          await message.channel.send(
            `That command doesn't exist; did you mean \`!mh whitelist add ${args[0]}\`?`
          );
          break;
      }

      if (rcon_cmd !== null) {
        try {
          const result = await runRCON(rcon_cmd);
          await message.channel.send(`RCON : \`\`\`${result}\`\`\``);
        } catch (error) {
          await message.channel.send("Error occurred attempting to send RCON");
        }
      }
    }
  } else if (command === "args-info") {
    if (!args.length) {
      return message.channel.send(
        `You didn't provide any arguments, ${message.author}!`
      );
    } else if (args[0] === "foo") {
      return message.channel.send("bar");
    }
    message.channel.send(`First argument: ${args[0]}`);
  }
});

// Login to the bot with the token
bot.login(process.env.MH_DISCORD_BOT_TOKEN);
