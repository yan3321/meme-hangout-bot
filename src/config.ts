import { config as load_env } from "dotenv-safe";
load_env();

const env = process.env;

export default {
  discord: {
    token: env.MH_DISCORD_BOT_TOKEN,
    channelId: env.MH_DISCORD_CHANNEL_ID,
    messageId: env.MH_DISCORD_MESSAGE_ID,
    clientId: env.MH_DISCORD_CLIENT_ID,
    guildId: env.MH_DISCORD_GUILD_ID,
  },
  minecraft: {
    hostname: env.MH_MINECRAFT_HOSTNAME,
    rcon: {
      password: env.MH_MINECRAFT_RCON_PASSWORD,
    },
  },
};
