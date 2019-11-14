const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const authRoute = require('./routes/auth')

dotenv.config()

const port = process.env.PORT || 3001

app.use(express.json())
app.use(cors())

mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, () => console.log("DB connected...")
)

io.on('connection', (socket) => {
    console.log("socket connected")
    socket.on('chat-message', (data) => {
        console.log(`Chat working: ${JSON.stringify(data)}`)
    })
})

app.use('/', authRoute)

http.listen(port, () => {
    console.log(`Listening on port ${port}`)
})