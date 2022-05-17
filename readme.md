# Project Based Chat
Discord bot with example of handling the calling of polling youtube data for indication if a stream is online. For educational purposes only -- I do not encourage anyone to use this.


installing:

I used node version `v18.1.0`

`npm i && node index.js`



`ytLiveState.js` manages a state for handling the different states of a youtube live stream. 
1. stream is offline.
2. stream is online.
3. stream is remaining offline.
4. stream went offline as result of error in fetch or data but resumed being offline.
5. stream switches from online to offline
6. preventing irratic youtube server side changing of a stream going from online to offline through `streamerIsOn` being delayed from being called again or losing live status.

See my implementation in `index.js` for details.

## TODOs
Youtube Live stream alerts: [x]
Twitter URL suppression when has spyware query params: [x]
Fake news filter command []
Live stream dashboard for 2022 riots []