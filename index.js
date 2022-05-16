import Discord from "discord.js"
import { getLiveVideoURLFromChannelID } from "./urlUtils.js"
import dotenv from "dotenv"
dotenv.config()
const toSeconds= (seconds=> seconds*1000)
const toMinutes =(minutes=> 60_000 * minutes)
const token = process.env.discord_token

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES"
    ]
})
const guildId = "926798796996898897"
//main 926798797844135948
const channelId = "929303551384117248"
// const ytChannelId = "UCPHWVzGcW-iozudjp8U984g"
// const pollingIntervalTimer = toSeconds(37)
// const timeToDelayCheck = toMinutes(5) 

const ytChannelId = "UCSJ4gkVC6NrvII8umztf0Ow"
const pollingIntervalTimer = toSeconds(5)
const timeToDelayCheck = toSeconds(13) 


// const ytChannelId = "UCSJ4gkVC6NrvII8umztf0Ow"
client.on("messageCreate", async (message) =>{
    const lowerCaseCommand = message.content.toLowerCase()
    
    if(lowerCaseCommand.includes("!live")){
        const { canonicalURL, isStreaming } = await getLiveVideoURLFromChannelID(ytChannelId);
        console.log({ canonicalURL, isStreaming })
        
        message.reply(canonicalURL)
        return;
    }
})

/**
 * 
 * @param {object} state 
 * @param {function} actionWhenDoubleCheckIsTrue 
 * @returns 
 */
const handleDoubleCheck = async (state, actionWhenDoubleCheckIsTrue) =>{
    console.log("handleDoubleCheck")
    const {setDoubleCheckIfOffline, setStreamerIsAlreadyOnline} = state
    
    const {isStreaming} = await getLiveVideoURLFromChannelID(ytChannelId)

    if(state.doubleCheckIfOffline){
    actionWhenDoubleCheckIsTrue()

    }
    if(isStreaming){
        setStreamerIsAlreadyOnline(true)
        return;
    }
    if(!isStreaming && !state.streamerIsAlreadyOnline){
        setDoubleCheckIfOffline(false)
        setStreamerIsAlreadyOnline(false)
    }
}

/**
 * 
 * @param {object} state 
 * @param {function} actionWhenStreamIsOn 
 * @returns 
 */
const handleStreamerIsOn = async (state, actionWhenStreamIsOn)=>{
    console.log("handleStreamerIsOn")
    const {setStreamerIsAlreadyOnline, setStreamerIsOn} = state
    const {isStreaming} = await getLiveVideoURLFromChannelID(ytChannelId)
    const sendMessageToEveryone = isStreaming && !state.streamerIsAlreadyOnline && !state.doubleCheckIfOffline
    if(sendMessageToEveryone){
        //send message to everyone
        setStreamerIsAlreadyOnline(true)
        setStreamerIsOn(true)
        actionWhenStreamIsOn()
        setTimeout(()=> setStreamerIsOn(false), timeToDelayCheck)
        return;
    } 
    if(!sendMessageToEveryone){
        return
    }
}

/**
 * 
 * @param {object} state 
 * @returns 
 */
const handleStreameIsRemainingOnline = async (state) =>{
    console.log("handleStreamIs", {})
    const {isStreaming} = await getLiveVideoURLFromChannelID(ytChannelId)
    console.log({isStreaming})
    const {setDoubleCheckIfOffline, setStreamerIsAlreadyOnline} = state
    if(isStreaming){
        setStreamerIsAlreadyOnline(true)
        console.log("streamer is still online")
        return
    }
    if(!isStreaming && !state.doubleCheckIfOffline && !state.streamIsAlreadyOnline){
        setDoubleCheckIfOffline(true)
        return;
    }
}
client.on("ready", () =>{
    console.log("bot is online")
    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(channelId);
    
    const handleYouTubePoll = () =>{
        
        const state = {
            streamerIsOn : false,
            streamIsAlreadyOnline : false,
            doubleCheckIfOffline : false,
            setStreamerIsOn(val){
                state.streamerIsOn= val
            },
            setStreamerIsAlreadyOnline(val){
                state.streamerIsAlreadyOnline= val
            },
            setDoubleCheckIfOffline(val){
                console.log(state.doubleCheckIfOffline)
            state.doubleCheckIfOffline=val
        },
    }
    if(state.streamerIsOn){
        return
    }
    
    const interval = setInterval(() =>{
        console.log({state})
        handleStreameIsRemainingOnline(state)
        handleDoubleCheck(state, () =>{
            // send streamer has gone permanently offline
            channel.send("PA has gone offline")
            client.user.setActivity('stream offline', { type: 'PLAYING' });

        })
        
        
        handleStreamerIsOn(state, async () =>{
            //send message only once
            const {canonicalURL} = await getLiveVideoURLFromChannelID(ytChannelId)
            channel.send(`stream is live ${canonicalURL}`)
            client.user.setActivity('stream online', { type: 'PLAYING' });
            
        })
        
    }, toSeconds(pollingIntervalTimer) )
}
handleYouTubePoll()
})




client.login(token)