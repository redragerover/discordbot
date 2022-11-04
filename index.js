import Discord from "discord.js";
import dotenv from "dotenv";

import {
  twitterUrlPurifier,
  UTM_Purifier,
  getLiveVideoURLFromChannelID,
} from "ytlivemanager/urlUtils.js";
import { catchingTubePoll, mainYtPoll } from "./src/ytPolling.js";
dotenv.config();

const token = process.env.discord_token;
const ytChannelId = process.env.youtube_channelId;

const nodeArguments = process.argv;
const isTestingInProd = nodeArguments.includes("test");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_BANS", "GUILD_MESSAGE_TYPING"],
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || isTestingInProd) {
    return;
  }
  const lowerCaseCommand = message.content.toLowerCase();

  const { purifiedTwitterUrl } = twitterUrlPurifier(lowerCaseCommand);

  if (purifiedTwitterUrl) {
    message.suppressEmbeds(true);
    message.reply(purifiedTwitterUrl);
  }
  const utmFreeURL = UTM_Purifier(lowerCaseCommand);
  if (!purifiedTwitterUrl && utmFreeURL) {
    message.suppressEmbeds(true);
    message.reply(utmFreeURL);
  }

  if (lowerCaseCommand.includes("!troop")) {
    message.send("FUCK U TROOP");
    return;
  }

  if (lowerCaseCommand.includes("!live")) {
    const { canonicalURL, isStreaming } = await getLiveVideoURLFromChannelID(
      ytChannelId
    );
    if (canonicalURL && isStreaming) {
      message.reply(canonicalURL);
      return;
    }
    message.reply("PA is not live");
    return;
  }
});

client.on("ready", () => {
  console.log("Project Based Chat is online");
  mainYtPoll(client);
  !isTestingInProd && catchingTubePoll(client);
});

client.login(token);
