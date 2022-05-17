
import { parse } from 'node-html-parser'
import fetch from 'node-fetch'


// process.argv is array of arguments passed in console

const getLiveVideoURLFromChannelID = async (channelID) => {

    const response = await fetch(`https://youtube.com/channel/${channelID}/live`)
    const text = await response.text()
    const html = parse(text)
    const canonicalURLTag = html.querySelector('link[rel=canonical]')
    let canonicalURL = canonicalURLTag.getAttribute('href')

    const isStreaming = canonicalURL.includes('/watch?v=') && text.includes('isLive":true}}') && !text.includes("Scheduled for")

    canonicalURL = isStreaming ? canonicalURL : "Channel is not live"
    return { canonicalURL, isStreaming }
}

export { getLiveVideoURLFromChannelID }
