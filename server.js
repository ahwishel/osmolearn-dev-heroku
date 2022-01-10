const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const {PeerServer} = require('peer')
const env = require('dotenv').config()
const cors = require('cors')
const http = require('http')
const app = express()
// const ioServer = require('./ioServer')
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'build')));

//Routers
const indexRouter = require('./routers/index')
const callRouter = require('./routers/callRouter')
const { Mongoose } = require('mongoose')

let httpServer = http.createServer(app)

app.use('/accounts', indexRouter)

app.use('/call', callRouter)

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

//code to initialize mongodb with mongoose
const dbURI = 'mongodb+srv://ahwishel:osmolearn-dev@osmolearn-dev.onrwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.connect(dbURI).then(() => {
    console.log("DB connection successfull")
}).catch(e => {
    console.error(e)
    console.log(e)
    console.log("DB CONNECTION FAILED MAN")
})

console.log(process.env.PORT)

let socketIO = require('socket.io')
const io = socketIO(httpServer)
let rooms = {} //will keep track of all active 1-1 tutoring rooms/sessions
io.on('connection', socket => {
    console.log(socket.id,"connected")
    socket.on('user connected', ({sessionId, name}) => {
        console.log(socket.id, "is going to join")
        socket.join(sessionId)
        if(!rooms.hasOwnProperty(sessionId)){
            rooms[sessionId] = {
                sessionId: sessionId,
                participants: [{socketId: socket.id, name: name}],
            }
            console.log("room created for session:", sessionId)
            console.log(name, "joined", sessionId)
        } else {
            rooms[sessionId].participants.push({socketId: socket.id, name: name})
            console.log(name, "joined", sessionId)
            //assumes 2 users connected already (will change later for classrooms)
            io.to(sessionId).emit("all clients connected", true)
        }
    })
    socket.on('disconnect', () => {
        let sessionId;
        let name;
        for(let room in rooms){
            rooms[room].participants.forEach(participant => {
                if(participant.socketId === socket.id){
                    sessionId = room
                    name = participant.name
                }
            })
            if(sessionId && name){
                break //Found what we needed to
            }
        }
        if(rooms.hasOwnProperty(sessionId)){
            //Remove User from participants
            console.log(name, "disconnected from ", sessionId)
            rooms[sessionId].participants = rooms[sessionId].participants.filter(participant => participant.socketId !== socket.id)
            socket.leave(sessionId)
            //If no one is in the room, remove room from rooms object
            if(rooms[sessionId].participants.length === 0){
                delete rooms[sessionId]
                console.log(sessionId, "deleted")
            }
        }
    })
    socket.on('disable video', ({sessionId,disable}) => {
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                if(disable){
                    socket.to(participant.socketId).emit('disable other client video', true)
                } else {
                    socket.to(participant.socketId).emit('enable other client video', true)
                }
            }
        })
    })
    socket.on('disable audio', ({sessionId,disable}) => {
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                if(disable){
                    socket.to(participant.socketId).emit('disable other client audio', true)
                } else {
                    socket.to(participant.socketId).emit('enable other client audio', true)
                }
            }
        })
    })
    socket.on('draw', ({sessionId, canvasPaths}) => {
        if(canvasPaths.paths.length > 1){ //The first point is sent twice so this is to limit it.
            rooms[sessionId].participants.forEach(participant => {
                if(participant.socketId !== socket.id){
                    socket.to(participant.socketId).emit('draw', canvasPaths)
                }
            })
        }
    })

    socket.on('undo', ({sessionId}) => {
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('undo')
            }
        })
    })

    socket.on('redo', ({sessionId}) => {
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('redo')
            }
        })
    })

    socket.on('screenshare', ({sessionId}) => {
        console.log(`${socket.id} started screen sharing`)
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('screenshare')
            }
        })
    })
    socket.on('end screenshare', ({sessionId}) => {
        console.log(`${socket.id} stopped screen sharing`)
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('end screenshare')
            }
        })
    })
    socket.on('message', ({sessionId, message}) => {
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('message', message)
            }
        })
    })
})

httpServer.listen(process.env.PORT || 5000, ()=> {
    console.log("Server is live on port 5000")
    // ioServer.listen(5001, () => {
    //     console.log(`IO server is ready on port ${process.env.PORT}`)
    // })
    const peerServer = new PeerServer({path: '/callpeer', port: '3001'})
})