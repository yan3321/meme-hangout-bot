import { config as load_env } from "dotenv-safe";
load_env();

import { Client, TextChannel, Intents, Message } from "discord.js";

import { registerCommands } from "./command-registration.js";

const bot = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES] });

import config from "./config.js";
import { getStatusEmbed, runRCON } from "./utils/minecraft.js";

// Refresh interval, in seconds
const refresh_interval = 10;

let message: Message = null;

async function getMessage() {
  const channel = await bot.channels.fetch(config.discord.channelId);
  if (channel instanceof TextChannel) {
    message = await channel.messages.fetch(config.discord.messageId);
    return message;
  } else {
    throw new Error("Channel fetched by ID is not a text channel");
  }
}

async function update() {
  if (message === null) {
    message = await getMessage();
  }
  await message.removeAttachments();
  const { embeds, files } = await getStatusEmbed();
  message.edit({
    embeds: embeds,
    files: files,
  });
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
