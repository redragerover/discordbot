import Discord from "discord.js";
import dotenv from "dotenv";

import { handleYouTubePoll } from "ytlivemanager";
import {
  twitterUrlPurifier,
  getLiveVideoURLFromChannelID,
} from "ytlivemanager/urlUtils.js";
dotenv.config();

const token = process.env.discord_token;
const guildId = process.env.discord_serverId;
const channelId = process.env.discordChannelId;
const ytChannelId = process.env.youtube_channelId;

const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_BANS", "GUILD_MESSAGE_TYPING"],
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }
  const lowerCaseCommand = message.content.toLowerCase();

  const { purifiedTwitterUrl } = twitterUrlPurifier(lowerCaseCommand);
  if (purifiedTwitterUrl) {
    message.suppressEmbeds(true);
    message.reply(purifiedTwitterUrl);
  }

  if (lowerCaseCommand.includes("!troop")) {
    message.send("FUCK U TROOP");
    return;
  }

  if (lowerCaseCommand.includes("!live")) {
    const { canonicalURL } = await getLiveVideoURLFromChannelID(ytChannelId);
    message.reply(canonicalURL);
    return;
  }
});

client.on("ready", () => {
  console.log("Project Based Chat is online");
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get("929303551384117248" || channelId);

  const streamToLive = (canonicalURL) => {
    channel.send(
      `<@222540413943283712> stream is live @everyone @everyone @everyone ${canonicalURL}`
    );
    client.user.setActivity(`PA is online !live`, {
      type: "PLAYING",
    });
  };
  const streamGoesOffline = () => {
    client.user.setActivity("PA OFFLINE", { type: "PLAYING" });
  };

  handleYouTubePoll({
    identifier: ytChannelId,
    streamGoesOffline: streamGoesOffline,
    streamToLive: streamToLive,
  });
});

client.login(token);
