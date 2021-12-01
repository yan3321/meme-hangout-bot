import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";

import { getStatusEmbed, runRCON, serverOffline } from "../utils/minecraft.js";
import { commandFile } from "../types.js";

async function rconHandler(whitelist_cmd: string, target?: string) {
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
      return `Unknown command!`;
  }

  if (rcon_cmd !== null) {
    try {
      const result = await runRCON(rcon_cmd);
      return `RCON : \`\`\`${result}\`\`\``;
    } catch (error) {
      console.error(error);
      return "Error occurred attempting to send RCON";
    }
  }
}

const data = new SlashCommandBuilder()
  .setName("minecraft")
  .setDescription("Do things with the Minecraft server!")
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("whitelist")
      .setDescription("Manage the whitelist of the Minecraft server!")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("list")
          .setDescription("View the whitelist of the Minecraft server!")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("add")
          .setDescription(
            "Add someone to the whitelist of the Minecraft server!"
          )
          .addStringOption((option) =>
            option
              .setName("username")
              .setDescription(
                "The Minecraft username of the player to whitelist"
              )
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("remove")
          .setDescription(
            "Remove someone from the whitelist of the Minecraft server!"
          )
          .addStringOption((option) =>
            option
              .setName("username")
              .setDescription("The Minecraft username of the player to remove")
              .setRequired(true)
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("status")
      .setDescription("Get the current Minecraft server status!")
  );

async function handleInteraction(interaction: CommandInteraction<CacheType>) {
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommandGroup === "whitelist") {
    const offline = await serverOffline();
    if (!offline) {
      const reply = await rconHandler(
        interaction.options.getSubcommand(true),
        interaction.options.getString("username", false)
      );
      await interaction.reply(reply);
    } else {
      await interaction.reply(
        `The Minecraft server appears to be unreachable at the moment.`
      );
    }
  } else if (subcommand === "status") {
    const status = await getStatusEmbed();
    await interaction.reply({
      content: `Here is the current Minecraft server status!`,
      embeds: [status],
    });
  } else {
    await interaction.reply(`Unfortunately, I can't answer that right now!`);
  }
}

const commandData = {
  data: data,
  handleInteraction: handleInteraction,
} as commandFile;

export default commandData;
