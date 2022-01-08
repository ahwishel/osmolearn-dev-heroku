const mongoose = require('mongoose')

const ClientSchema = new mongoose.Schema({
    firstname: {type:String, required: true, max: 20},
    lastname: {type: String, required: true, max: 20},
    username: {type: String, required:true, max:15},
    email: {type:String, required: true},
    password: {type: String, required: true},
    peerId: {type: String, required:true},
    bio: {type: String, max: 500},
    assignedTutors: {type: Array, default: []},
    upcomingSessions: {type: Array, default: []},
    isTutor: {type: Boolean, required: true} //There will be a special administrative portals to make tutor accounts
})

module.exports = mongoose.model('Client', ClientSchema)