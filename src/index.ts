import { config as load_env } from "dotenv-safe";
load_env();

import { Client, TextChannel, Intents } from "discord.js";

import { registerCommands } from "./command-registration.js";

const bot = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES] });

import config from "./config.js";
import { getStatusEmbed, runRCON } from "./utils/minecraft.js";

// Refresh interval, in seconds
const refresh_interval = 10;

async function getChannel() {
  const channel = await bot.channels.fetch(config.discord.channelId);
  if (channel instanceof TextChannel) {
    return channel;
  } else {
    throw new Error("Channel fetched by ID is not a text channel");
  }
}

async function update() {
  const channel = await getChannel();
  const message = await channel.messages.fetch(config.discord.messageId);
  const statusEmbed = await getStatusEmbed();
  message.edit({ embeds: [statusEmbed] });
}

async function serverTests() {
  console.log("Testing RCON functionality...");
  try {
    const result = await runRCON("whitelist list");
    console.log(result);
    console.log("RCON results received!");
  } catch (error) {
    console.error(error);
    console.error("RCON tests failed!");
  }
}

// Start the loop when the bot's up
bot.on("ready", () => {
  const presence = bot.user.setActivity(config.minecraft.hostname, {
    type: "WATCHING",
  });
  console.log(presence);
  update();
  setInterval(update, refresh_interval * 1000);
});

// Login to the bot with the token
await registerCommands(bot);
await bot.login(config.discord.token);
await serverTests();
