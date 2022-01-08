const mongoose = require('mongoose')

const ClassroomSessionSchema = new mongoose.Schema({
    sessionId: {type: String, required: true},
    studentParticipants: {type: Array, required: true}, //will store objects containing student id and time for session
    tutorId: {type: String, required: true},
    tutorDate: {type: Date, required: true},
    isCompleted: {type: Boolean, required: true},
    hoursSpent: {type: Number, required: true},
    paymentAmount: {type: Number, required: true}
})

module.exports = mongoose.model('ClassroomSession', ClassroomSessionSchema)