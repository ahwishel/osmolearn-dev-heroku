const express = require('express')
const callRouter = express.Router()
const Client = require('../models/ClientSchema')
const OneToOneSession = require('../models/OneToOneSessionSchema')


//Looks for session with <sessionId> and sends back all participant peerIds' with exception to <username>'s own peerId
callRouter.get('/:username/:sessionId', (req, res) => {
    let userIsTutor = null
    Client.findOne({username: req.params.username}, (err, client) => {
        if(err){
            console.error(err)
            res.status(err.response.status).json({error: err})
            return
        }
        userIsTutor = client.isTutor
        OneToOneSession.findOne({sessionId: req.params.sessionId}, (err, session) => {
            if(err){
                console.error(err)
                res.status(err.response.status).json({error: err})
            }
            console.log(userIsTutor)
            if(userIsTutor !== null && userIsTutor){
                res.send(session.studentId)
            } else if(userIsTutor !== null && !userIsTutor) {
                res.send(session.tutorId)
            } else {
                res.status(500).json({error: "userIsTutor is null"})
            }
        })
    })
})
//sends to each user peer ids for all participants
callRouter.get('/classroom/:username/:sessionId', (req, res) => {
    res.send(`participants' peer ids for ${req.params.sessionId}: [hardcoded]`)
})

module.exports = callRouter