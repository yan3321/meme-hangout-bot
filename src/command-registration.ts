import { Client } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

import path from "path";
import { promises as fs } from "fs";

import config from "./config.js";
import { commandFile } from "./types.js";

const __dirname = (() => {
  const x = path.dirname(decodeURI(new URL(import.meta.url).pathname));
  return path.resolve(process.platform == "win32" ? x.substr(1) : x);
})();

const commands = [];
const commandFiles = (
  await fs.readdir(path.resolve(__dirname, "./commands"))
).filter((file) => file.endsWith(".js"));

const rest = new REST({ version: "9" }).setToken(config.discord.token);

export async function registerCommands(client: Client) {
  try {
    for (const file of commandFiles) {
      const commandData = (await import(`./commands/${file}`))
        .default as commandFile;
      const data = commandData.data;
      const interactionHandler = commandData.handleInteraction;
      commands.push(data.toJSON());
      client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
          if (data.name === interaction.commandName) {
            try {
              await interactionHandler(interaction);
            } catch (error) {
              console.error(error);
              await interaction.reply(
                "There was an error processing your command, sorry!"
              );
            }
          }
        }
      });
    }

    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        config.discord.clientId,
        config.discord.guildId
      ),
      {
        body: commands,
      }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
