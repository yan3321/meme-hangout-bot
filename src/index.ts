import { config as load_env } from "dotenv-safe";
load_env();
import { performance } from "perf_hooks";
import { promisify } from "util";
import { Client, TextChannel, Message, ActivityType } from "discord.js";

import { registerCommands } from "./command-registration.js";
import { getStatus, getStatusEmbed, runRCON } from "./utils/minecraft.js";

import config from "./config.js";

// Refresh interval, in seconds
const refresh_interval = 10;

const bot = new Client({ intents: ["GuildMessages"] });

let message: Message | null = null;

async function getMessage() {
  const channel = await bot.channels.fetch(config.discord.channelId);
  if (channel instanceof TextChannel) {
    message = await channel.messages.fetch(config.discord.messageId);
    return message;
  } else {
    throw new Error("Channel fetched by ID is not a text channel");
  }
}

async function loopTimeout() {
  return promisify(setTimeout)(refresh_interval * 1000);
}

async function startLoop() {
  while (true) {
    await update();
    await loopTimeout();
  }
}

async function update() {
  const t1 = new Date();
  try {
    const n1 = performance.now();
    if (message === null) {
      message = await getMessage();
    }
    console.dir(message.embeds, { depth: null });
    const results = await Promise.all([
      message?.removeAttachments(),
      getStatusEmbed(),
    ]);
    const { embeds, files } = results[1];
    console.log(files);
    await message.edit({
      embeds: embeds,
      // files: files,
    });
    const t2 = new Date();
    const n2 = performance.now();
    console.log(
      `Successfully updated in ${((n2 - n1) / 1000).toFixed(
        2
      )} s, current timestamp ${t2.toLocaleTimeString()}, original timestamp ${t1.toLocaleTimeString()}`
    );
  } catch (error) {
    console.error(`Error occurred at timestamp ${t1.toLocaleTimeString()}`);
    console.error(error);
  }
}

async function serverTests() {
  async function statusTest() {
    try {
      const status = await getStatus();
      return true;
    } catch (error) {
      console.error(error);
      console.error("Status test failed!");
      return false;
    }
  }

  async function rconTest() {
    console.log("Testing RCON functionality...");
    try {
      const result = await runRCON("whitelist list");
      console.log("RCON results received!");
      return true;
    } catch (error) {
      console.error(error);
      console.error("Server functionality tests failed!");
      return false;
    }
  }

  console.log("Testing server functionality...");
  try {
    const [status, rcon] = await Promise.all([statusTest(), rconTest()]);
    if (!status || !rcon) {
      throw new Error();
    }
  } catch (error) {
    console.error(error);
    console.error("Server functionality tests failed!");
  }
}

// Start the loop when the bot's up
bot.once("ready", async () => {
  const presence = bot.user?.setActivity(config.minecraft.hostname, {
    type: ActivityType.Watching,
  });
  console.log(presence);
  startLoop();
});

// Login to the bot with the token
await registerCommands(bot);
await bot.login(config.discord.token);
await serverTests();
