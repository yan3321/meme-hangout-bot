import pkg from "minecraft-server-util";
const { status: mcStatus, RCON } = pkg;

import { promises as dns } from "dns";

import config from "../config.js";
import {
  AttachmentBuilder as MessageAttachment,
  EmbedBuilder as MessageEmbed,
} from "discord.js";

const hostname = config.minecraft.hostname;

function isset(object: any) {
  if (typeof object !== "undefined" && object !== null) {
    return true;
  }
  return false;
}

export async function getStatus() {
  return mcStatus(hostname, undefined, { enableSRV: true });
}

export async function serverOffline() {
  try {
    await getStatus();
    return false;
  } catch (error) {
    return true;
  }
}

let srvHost: string | null = null;

export async function runRCON(command: string) {
  const rcon = new RCON();
  if (srvHost === null) {
    const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${hostname}`);
    const firstRecord = srvRecords[0];
    srvHost = firstRecord.name;
  }
  await rcon.connect(srvHost, 25575);
  await rcon.login(config.minecraft.rcon.password);
  const result = await rcon.execute(command);
  await rcon.close();
  return result;
}

export async function getStatusEmbed() {
  const colour_green = 65280;
  const colour_red = 16711680;

  // Create new embed from given structure
  const embed = new MessageEmbed();

  embed.setAuthor({ name: "Minecraft Server Status" });
  embed.setFooter({ text: "Refreshes every 10 seconds" });
  embed.addFields([{ name: "IP", value: `\`${hostname}\``, inline: false }]);
  embed.setTimestamp(new Date());
  embed.setColor(colour_red);

  const files: MessageAttachment[] = [];

  try {
    const status = await getStatus();

    // if (status.favicon) {
    //   const fileName = "server_icon.png";
    //   const image = dataUriToBuffer(status.favicon);
    //   const file = new MessageAttachment(image, fileName);
    //   files.push(file);
    // }

    embed.setAuthor({
      name: "Minecraft Server Status",
      iconURL: files[0]
        ? `attachment://${files[0].name}`
        : `https://api.mcstatus.io/v2/icon/${hostname}`,
    });

    embed.setColor(colour_green);

    const version = status.version.name;
    const desc = status.motd.clean;
    const onlinePlayers = status.players.online;
    const maxPlayers = status.players.max;
    const samplePlayers = status.players.sample;

    // Set online status
    embed.addFields({
      name: "Status",
      value: "Online",
      inline: true,
    });
    // Add disclaimer
    // embed.description = `This server is whitelisted; add yourself to the whitelist using \`!mh whitelist add <username>\` \n e.g. \`!mh whitelist add Player1\``;
    // Add version info
    if (isset(version)) {
      embed.addFields({
        name: "Version",
        value: version,
        inline: true,
      });
    }
    // Add description info
    if (isset(desc)) {
      embed.addFields({
        name: "Description",
        value: desc,
        inline: false,
      });
    }
    // Add players online info
    if (isset(onlinePlayers) && isset(maxPlayers)) {
      embed.addFields({
        name: "Players Online",
        value: "**" + onlinePlayers + "** / " + maxPlayers,
        inline: false,
      });
    }
    let playerListString = "";
    if (samplePlayers) {
      // sort the player list array alphabetically, case-insensitive
      samplePlayers.sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      // add the players to the concatenated string
      samplePlayers.forEach((plr) => {
        playerListString += "• `" + plr.name + "`\n";
      });
    }
    // if the player list string isn't empty, add Player List field to the embed
    if (playerListString !== "") {
      embed.addFields({
        name: "Player List",
        value: playerListString,
        inline: false,
      });
    }
  } catch (error) {
    // Set online status
    embed.addFields({
      name: "Status",
      value: "Offline",
      inline: true,
    });
  }

  return { embeds: [embed], files: files };
}
