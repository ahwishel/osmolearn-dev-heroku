const express = require('express')
const indexRouter = express.Router()
const Client = require('../models/ClientSchema')
const OneToOneSession = require('../models/OneToOneSessionSchema')
const {v4:uuidv4} = require('uuid')


indexRouter.post('/signup', (req, res) => {
    console.log(req.body)
    //TODO: Santize input

    //Create a new client
    const newClient = new Client({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        peerId: req.body.peerId,
        bio: req.body.bio,
        assignedTutors: req.body.assignedTutors,
        upcomingSessions: req.body.upcomingSessions,
        isTutor: req.body.isTutor
    })
    //Save new client document and send back a confirmation
    newClient.save().then(client => res.status(201).json({userCreated:true, clientInfo: client}))
                    .catch(error => {
                        console.error(error)
                        res.status(500).json({userCreated: false, error: error})
                    })
})

indexRouter.post('/signin', (req, res) => {
    res.send("Sign in page")
})

//sends user's upcoming tutoring session as well as other relevant data to the homepage
indexRouter.get('/:username', (req, res) => {
    Client.findOne({username: req.params.username}, (err, client) => {
        if(err){
            console.error(err)
            res.status(500).json({error: err})
        } else {
            // console.log(client)
            res.json(client)
        }
    })
})

//sends user's current assigned tutors/students (must send peerIds and names)
indexRouter.get('/:username/request', (req, res) => {
    res.send(`${req.params.username}'s assigned tutors: [hardcoded]`)
})

//creates a new 1-1 session between tutor and student
indexRouter.post('/:username/request', (req, res) => {
    //TODO: Find out if person corresponding to username is tutor or student
    Client.findOne({username: req.params.username}, (err, client) => {
        if(err){
            res.status(err.status).send("An error occured while finding client")
        } else {

            const sessionData = {
                sessionId: uuidv4(),
                studentId: client.isTutor? req.body.studentId : client.peerId, //student's peer id
                tutorId: client.isTutor? client.peerId: req.body.tutorId,
                studentTime: new Date(),//will be changed to actual date object with student's time zone in mind later
                tutorTime: new Date(),
                isCompleted: false,
                hoursSpent: 0.00,
                paymentAmount: 0.00
            }

            //TODO:Create a new OneToOneSession instance
            const newSession = new OneToOneSession(sessionData)

            newSession.save().then(session => {
                // res.status(201).json({sessionStatus: "created", sessionInfo: session})
            }).catch(err => {
                console.error(err)
                res.json({sessionStatus: "failed to create session", error: err})
            })
            //TODO:Update client's upcoming sessions to have an object containing a the other client's peerId, fullname, 
            //     time converted to student's time as well as the session id (don't do time for now its a pain, just do the rest for now)
            Client.updateOne({username: client.username}, {upcomingSessions: [...client.upcomingSessions, sessionData]}, (err, result) => {
                if(err){
                    console.error(err)
                    res.status(err.response.status).json({sessionStatus: "failed to update client's sessions", error: err})
                }
                console.log(result)
            })

            //Update other client's upcoming sessions because that doesn't happen
            Client.updateOne({peerId: client.isTutor? req.body.studentId : req.body.tutorId}, {upcomingSessions: [...client.upcomingSessions, sessionData]}, (err, result) => {
                if(err){
                    console.error(err)
                    res.status(err.response.status).json({sessionStatus: "failed to update client's sessions", error: err})
                } else {
                    res.status(204).json(result)
                }
            })
        }
    })
})

//creates a classroom type session
indexRouter.post('/:username/request/classroom', (req, res) => {
    res.send(`${req.params.username} created a new session with id: hardcoded`)
})

//sends user's current settings like image, bio info, etc
indexRouter.get('/:username/settings', (req, res) => {
    res.send(`${req.params.username}'s settings: [hardcoded]`)
})

module.exports = indexRouter