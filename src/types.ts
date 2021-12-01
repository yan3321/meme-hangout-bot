import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";

export interface commandFile {
  data: SlashCommandBuilder;
  handleInteraction: (
    interaction: CommandInteraction<CacheType>
  ) => Promise<void>;
}
