const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const {PeerServer} = require('peer')
const env = require('dotenv').config()
const cors = require('cors')
const http = require('http')
const app = express()
const ioServer = require('./ioServer')
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

httpServer.listen(process.env.PORT || 5000, ()=> {
    console.log("Server is live on port 5000")
    ioServer.listen(5001, () => {
        console.log("IO server is ready on port 5001")
    })
    const peerServer = new PeerServer({path: '/call'})
})