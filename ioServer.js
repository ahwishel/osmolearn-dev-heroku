const express = require('express')
const cors = require('cors')
const http = require('http')
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

let ioServer = http.createServer(app)
const {Server} = require('socket.io')
const io = new Server(ioServer, {cors: {
    origin: '*',
    methods: ['GET', 'POST']
}})


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
        rooms[sessionId].participants.forEach(participant => {
            if(participant.socketId !== socket.id){
                socket.to(participant.socketId).emit('draw', canvasPaths)
            }
        })
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

module.exports = ioServer