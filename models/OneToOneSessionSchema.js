const mongoose = require('mongoose')

const OneToOneSessionSchema = new mongoose.Schema({
    sessionId: {type: String, required: true},
    studentId: {type: String, required: true},
    tutorId: {type: String, required: true},
    studentTime: {type: Date, required: true},
    tutorTime: {type: Date, required: true},
    isCompleted: {type: Boolean, required: true},
    hoursSpent: {type: Number, required: true},
    paymentAmount: {type: Number, required: true}
})

module.exports = mongoose.model('OneToOneSession', OneToOneSessionSchema)