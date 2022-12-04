import Discord from "discord.js";
import dotenv from "dotenv";

import {
  twitterUrlPurifier,
  UTM_Purifier,
  getLiveVideoURLFromChannelID,
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

client.on("messageCreate", async (message) => {
  if (message.content.includes("!uwuify")) {
    const nonRecursiveCommand = message.content.replace("!uwuify", "");
    const cleanMessage = nonRecursiveCommand.replace("'", "");

    if (message.type === "REPLY") {
      const repliedTo = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (repliedTo.author.id === client.user.id) {
        message.reply("uwuify yourself, filthy degenerate");
        return;
      }
      if (repliedTo.content) {
        //@TODO MUST ADD !UWUIFY filter
        execute(
          `echo '${repliedTo.content.replace("'", '"')}.' | uwuify`,
          (stdout) => {
            if (stdout) {
              repliedTo.reply(stdout);
            }
          }
        );
      }
    } else if (message.content.trim() === "!uwuify") {
      message.reply("provide a message");
    } else {
      execute(`echo '${cleanMessage}' | uwuify`, (stdout) => {
        if (stdout) {
          message.reply(stdout);
        }
      });
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
