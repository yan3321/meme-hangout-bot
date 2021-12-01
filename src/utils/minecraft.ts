import { status as mcStatus, RCON } from "minecraft-server-util";

import { promises as dns } from "dns";

import config from "../config.js";

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

let srvHost: string = null;

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
  const embed = {
    author: {
      name: "Minecraft Server Status",
      icon_url: `https://api.mcsrvstat.us/icon/${hostname}`,
    },
    color: colour_red,
    fields: [
      {
        name: "IP",
        value: `\`${hostname}\``,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Refreshes every 10 seconds",
    },
  };

  try {
    const status = await getStatus();
    const version = status.version.name;
    const desc = status.motd.clean;
    const onlinePlayers = status.players.online;
    const maxPlayers = status.players.max;
    const samplePlayers = status.players.sample;
    // Set timestamp
    embed.timestamp = new Date().toISOString();
    // Set status info
    embed.color = colour_green;
    // Set online status
    embed.fields.push({
      name: "Status",
      value: "Online",
      inline: true,
    });
    // Add disclaimer
    // embed.description = `This server is whitelisted; add yourself to the whitelist using \`!mh whitelist add <username>\` \n e.g. \`!mh whitelist add Player1\``;
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
      function addToString(playerObject) {
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
  } catch (error) {
    // Set timestamp
    embed.timestamp = new Date().toISOString();
    // Set status info
    embed.color = colour_red;
    // Set online status
    embed.fields.push({
      name: "Status",
      value: "Offline",
      inline: true,
    });
  }

  return embed;
}
