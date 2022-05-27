import { config as load_env } from "dotenv-safe";
load_env();

const env = process.env;

const throwEnvError = () => {
  throw new Error("Env is nullish");
};

export default {
  discord: {
    token: env.MH_DISCORD_BOT_TOKEN ?? throwEnvError(),
    channelId: env.MH_DISCORD_CHANNEL_ID ?? throwEnvError(),
    messageId: env.MH_DISCORD_MESSAGE_ID ?? throwEnvError(),
    clientId: env.MH_DISCORD_CLIENT_ID ?? throwEnvError(),
    guildId: env.MH_DISCORD_GUILD_ID ?? throwEnvError(),
  },
  minecraft: {
    hostname: env.MH_MINECRAFT_HOSTNAME ?? throwEnvError(),
    rcon: {
      password: env.MH_MINECRAFT_RCON_PASSWORD ?? throwEnvError(),
    },
  },
};
