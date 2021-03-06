import Discord from "discord.js"
import dotenv from "dotenv"

import { getLiveVideoURLFromChannelID, twitterUrlPurifier } from "./urlUtils.js"
import { handleDoubleCheck, handleStreameIsRemainingOnline, handleStreamerIsOn } from "./ytLiveState.js"

const toSeconds = seconds => seconds * 1000
const toMinutes = minutes => 60_000 * minutes

dotenv.config()
const token = process.env.discord_token
const guildId = process.env.discord_serverId
const channelId = process.env.discordChannelId
const ytChannelId = process.env.youtube_channelId

const pollingIntervalTimer = toSeconds(37)
const timeToDelayCheck = toMinutes(5)

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_BANS",
        "GUILD_MESSAGE_TYPING"
    ]
})

client.on("messageCreate", async (message) => {
    const lowerCaseCommand = message.content.toLowerCase()

    const { purifiedTwitterUrl } = twitterUrlPurifier(lowerCaseCommand)
    if (purifiedTwitterUrl) {
        message.suppressEmbeds(true)
        message.reply(purifiedTwitterUrl)
    }

    if (lowerCaseCommand.includes("!live")) {
        const { canonicalURL, isStreaming } = await getLiveVideoURLFromChannelID(ytChannelId);
        console.log({ canonicalURL, isStreaming })

        message.reply(canonicalURL)
        return;
    }
})

client.on("ready", () => {
    console.log("Project Based Chat is online")
    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(channelId);

    const handleYouTubePoll = () => {
        const state = {
            streamerIsOn: false,
            streamIsAlreadyOnline: false,
            doubleCheckIfOffline: false,
            setStreamerIsOn(val) {
                state.streamerIsOn = val
            },
            setStreamIsAlreadyOnline(val) {
                state.streamIsAlreadyOnline = val
            },
            setDoubleCheckIfOffline(val) {
                console.log(state.doubleCheckIfOffline)
                state.doubleCheckIfOffline = val
            },
        }
        const handleInterval = async () => {
            await getLiveVideoURLFromChannelID(ytChannelId).then(({ isStreaming, canonicalURL }) => {
                handleStreameIsRemainingOnline(state, isStreaming)
                handleDoubleCheck(state, () => {
                    // send streamer has gone permanently offline
                    channel.send("PA has gone offline")
                    client.user.setActivity('stream offline', { type: 'PLAYING' });

                }, isStreaming, timeToDelayCheck)


                handleStreamerIsOn(state, () => {
                    //send message only once
                    channel.send(`stream is live @everyone ${canonicalURL}`)
                    client.user.setActivity('stream online', { type: 'PLAYING' });

                }, isStreaming)
                return;
            }).catch(err => console.log(err))
        }

        const interval = setInterval(handleInterval, pollingIntervalTimer)
    }
    handleYouTubePoll()
})

client.login(token)