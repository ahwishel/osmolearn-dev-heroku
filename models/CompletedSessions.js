const mongoose = require('mongoose')

const CompletedSessionsSchema = new mongoose.Schema({
    isClassroom: {type: Boolean, required: true},
    session: {type: Object, required: true}
})

module.exports = mongoose.model('CompletedSession', CompletedSessionsSchema)