const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = 3001


app.use(express.json())


io.on('connection', (socket) => {
    console.log("socket connected")
    socket.on('chat-message', (data) => {
        console.log(`Chat working: ${data}`)
    })
})




http.listen(port, () => {
    console.log(`Listening on port ${port}`)
})