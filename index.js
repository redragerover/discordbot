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
const channelId = "926798797844135948"
const ytChannelId = "UCPHWVzGcW-iozudjp8U984g"
const pollingIntervalTimer = toSeconds(37)
const timeToDelayCheck = toMinutes(5) 

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
const handleDoubleCheck = (state, actionWhenDoubleCheckIsTrue, isStreaming) =>{
    console.log("handleDoubleCheck")
    const {setDoubleCheckIfOffline, setStreamIsAlreadyOnline} = state
    

    if(!state.doubleCheckIfOffline){
        return
    }

    if(isStreaming){
        setStreamIsAlreadyOnline(true)
        return;
    }
    if(!isStreaming){
        setDoubleCheckIfOffline(false)
        setStreamIsAlreadyOnline(false)
        actionWhenDoubleCheckIsTrue()
        console.log("stream permanently offline")
    }
}

/**
 * 
 * @param {object} state 
 * @param {function} actionWhenStreamIsOn 
 * @returns 
 */
const handleStreamerIsOn = (state, actionWhenStreamIsOn, isStreaming)=>{
    console.log("handleStreamerIsOn")
    const {setStreamIsAlreadyOnline, setStreamerIsOn} = state
    const sendMessageToEveryone = isStreaming && !state.streamIsAlreadyOnline && !state.doubleCheckIfOffline
    if(sendMessageToEveryone){
        //send message to everyone
        setStreamIsAlreadyOnline(true)
        setStreamerIsOn(true)
        actionWhenStreamIsOn()
        setTimeout(()=> setStreamerIsOn(false), timeToDelayCheck)
        return;
    } 
    if(!sendMessageToEveryone){
        console.log("stream offline")
        return
    }
}

/**
 * 
 * @param {object} state 
 * @returns 
 */
const handleStreameIsRemainingOnline = (state, isStreaming) =>{
    console.log("handleStreamIs", {})
    const {setDoubleCheckIfOffline, setStreamIsAlreadyOnline} = state
    if(isStreaming && state.streamIsAlreadyOnline){
        console.log("streamer is still online")
        return
    }
    if(!isStreaming && !state.doubleCheckIfOffline && state.streamIsAlreadyOnline){
        setDoubleCheckIfOffline(true)
        setStreamIsAlreadyOnline(false)
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
            setStreamIsAlreadyOnline(val){
                state.streamIsAlreadyOnline= val
            },
            setDoubleCheckIfOffline(val){
                console.log(state.doubleCheckIfOffline)
            state.doubleCheckIfOffline=val
        },
    }
    const handleInterval = async ()=>{
        await getLiveVideoURLFromChannelID(ytChannelId).then(({isStreaming, canonicalURL})=>{            
            handleStreameIsRemainingOnline(state, isStreaming)
            handleDoubleCheck(state, () =>{
                // send streamer has gone permanently offline
                channel.send("PA has gone offline")
                client.user.setActivity('stream offline', { type: 'PLAYING' });
                
            }, isStreaming)
            
            
            handleStreamerIsOn(state,() =>{
                //send message only once
                channel.send(`stream is live @everyone ${canonicalURL}`)
                client.user.setActivity('stream online', { type: 'PLAYING' });
                
            }, isStreaming)
            return;
        }).catch(err=>console.log(err))   
}


    const interval = setInterval(handleInterval, pollingIntervalTimer )
}
handleYouTubePoll()
})




client.login(token)