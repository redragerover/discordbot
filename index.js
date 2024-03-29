import Discord from "discord.js";
import dotenv from "dotenv";

import {
  twitterUrlPurifier,
  UTM_Purifier,
  getYoutubeLiveStatusFromChannelID,
} from "ytlivemanager/urlUtils.js";
import {
  catchingTubePoll,
  mainYtPoll,
  statusHandler,
} from "./src/ytPolling.js";
import { exec } from "child_process";
dotenv.config();
const token = process.env.discord_token;
const ytChannelId = process.env.youtube_channelId;

const nodeArguments = process.argv;
const isTestingInProd = nodeArguments.includes("test");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_BANS", "GUILD_MESSAGE_TYPING"],
});
const execute = (command, cb) => {
  exec(command, (err, stdout, stderr) => cb(stdout));
};
const uwuifyFilter = (toBeUwufied) => {
  const nonRecursiveCommand = toBeUwufied.replaceAll("!uwuify", "").trim();
  const cleanMessage = nonRecursiveCommand.replaceAll("'", "").trim();
  return cleanMessage;
};
let requestSent = false;
client.on("messageCreate", async (message) => {
  if (message.content.includes("!uwuify")) {
    const cleanMessage = uwuifyFilter(message.content);
    if (message.type === "REPLY") {
      const repliedTo = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (repliedTo.author.id === client.user.id) {
        message.reply("uwuify yourself, filthy degenerate");
        return;
      }
      if (repliedTo.content) {
        const repliedToClean = uwuifyFilter(repliedTo.content);
        execute(`echo '${repliedToClean}.' | uwuify`, (stdout) => {
          if (stdout) {
            repliedTo.reply(stdout);
          }
        });
      }
    } else if (message.content.trim() === "!uwuify") {
      message.reply("provide a message");
    } else {
      execute(
        `echo '${cleanMessage.replace("!uwuify", "")}' | uwuify`,
        (stdout) => {
          if (stdout) {
            message.reply(stdout);
          }
        }
      );
    }
    setTimeout(() => message.delete(), 2400);
  }
  if (
    message.author.bot ||
    isTestingInProd ||
    nodeArguments.includes("status")
  ) {
    return;
  }
  const lowerCaseCommand = message.content.toLowerCase();

  const { purifiedTwitterUrl } = twitterUrlPurifier(message.content);

  if (purifiedTwitterUrl) {
    message.suppressEmbeds(true);
    message.reply(purifiedTwitterUrl);
  }
  const utmFreeURL = UTM_Purifier(message.content);
  if (!purifiedTwitterUrl && utmFreeURL) {
    message.suppressEmbeds(true);
    message.reply(utmFreeURL);
  }

  if (lowerCaseCommand.includes("!live") && !requestSent) {
    const { canonicalURL, isStreaming } =
      await getYoutubeLiveStatusFromChannelID(ytChannelId);
    requestSent = true;
    if (canonicalURL && isStreaming) {
      setTimeout(() => {
        requestSent = false;
      }, 20000);
      message.reply(canonicalURL);
      return;
    }
    message.reply("PA is not live");
    return;
  }
});

client.on("ready", () => {
  console.log("Project Based Chat is online");
  if (nodeArguments.includes("status")) {
    statusHandler(client);
    return;
  }
  console.log("normal mode initialized");
  mainYtPoll(client);
  !isTestingInProd && catchingTubePoll(client);
  statusHandler(client);
});

client.login(token);
