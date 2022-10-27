import { handleYouTubePoll, handleGroupYoutubePoll } from "ytlivemanager";
import { CatchChnl, DiscordIDs } from "../utils/constants.js";

const ytChannelId = process.env.youtube_channelId;

const nodeArguments = process.argv;
const isTestingInProd = nodeArguments.includes("test");

export const catchingTubePoll = (client) => {
  const guild = client.guilds.cache.get(DiscordIDs.discordServerId);
  const groupChannel = guild.channels.cache.get(
    DiscordIDs.channels.liveCatchChannel
  );
  const streamToGroupLive = (canonicalURL) => {
    groupChannel.send(
      `${DiscordIDs.roles.catchingTube} catcher just went live ${canonicalURL}`
    );
  };
  const streamChannelOffline = () => {
    console.log("channel went offline");
  };
  handleGroupYoutubePoll({
    identifiers: Object.values(CatchChnl),
    streamToLive: streamToGroupLive,
    streamGoesOffline: streamChannelOffline,
  });
};

export const mainYtPoll = (client) => {
  const guild = client.guilds.cache.get(DiscordIDs.discordServerId);
  const channel = guild.channels.cache.get(
    isTestingInProd
      ? DiscordIDs.channels.botTesting
      : DiscordIDs.channels.mainChat
  );

  const streamToLive = (canonicalURL) => {
    const liveMessage = `${DiscordIDs.users.gyrok} stream is live @everyone @everyone @everyone ${canonicalURL}`;
    channel.send(!isTestingInProd ? liveMessage : "I am testing in prod");
  };
  const streamGoesOffline = () => {
    console.log("went offline");
  };

  handleYouTubePoll({
    identifier: ytChannelId,
    streamGoesOffline: streamGoesOffline,
    streamToLive: streamToLive,
  });
};
