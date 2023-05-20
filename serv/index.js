const express = require('express')
const app = express()
const PORT = 5000
const http = require('http').Server(app)

const whatsAppClient = require('@green-api/whatsapp-api-client')
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(bodyParser.json())

let restAPI = whatsAppClient.restAPI(({
    idInstance: "1101822443",
    apiTokenInstance: "dec4dce63ce04483b03be900646acb00c01379f0218b4ea98e"
}))


const socketIO = require('socket.io') (http, {
    cors: {
        origin: "http://localhost:3000"
    }
})

let msgs = []
let currentMsgs = [{messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Т' } }}]
let sendNumber = ""


socketIO.on('connection', (socket) => {
    console.log(`user connected ${socket.id}`)    

    socket.on('loginData', (data) => {
        console.log('user ins', data.idInstance)

    })

    socket.on('showMessages', (data) => {
        
        console.log(`ShowMSG from SERV ${data.socketID}`)

        restAPI.webhookService.startReceivingNotifications() 
        restAPI.webhookService.onReceivingMessageText((body) => {
            msgs.filter((msg) => {
                if(body.idMessage === msg.idMessage) {
                    msgs.splice(msgs.indexOf(msg), 1)
                    console.log('zaa', msg)
                }                
            })
            
            console.log("EMIIIIIIIIIIIIT" , body)
            msgs.push(body)

            msgs.filter((msg) => {
                if(msg.senderData.sender === `${sendNumber}@c.us`) {
                    console.log(`СОВПАЛО `, msg.senderData.chatId)
                    currentMsgs.push(msg)
                }
            })

            socketIO.emit('currentMsgResponse', currentMsgs)
            socketIO.emit('msgResponse', msgs)
        })
       
    })

    // socket.on('showCurrentMessages', (data) => {
    // })


    socket.on('setSendNumber', (data) => {
        console.log("SENDUSERRRRRR", data.sendNumber)
        sendNumber = data.sendNumber

        socketIO.emit('sendNumberSeted')
    } )

    socket.on('sendMsg', (text) => {

        console.log("I SEND MSG", text)
        restAPI.message.sendMessage(`${sendNumber}@c.us`, null, text)
        .then((data) => {
            console.log('responsemsg', text,  data);
        })
        .catch(e => {
            console.error('error from send msg', e)
        });

        socketIO.emit('sendMsgEv')
    })


    socket.on('userLogout', (data) => {
        console.log("logout", data)
    })


    socket.on('disconnect', () => {
        console.log(`user disconnected ${socket.id}`)        
    })
})


http.listen(PORT, () => {
    console.log(`Started. App listening on port 5000!`)
});
