const router = require('express').Router()
const { User, Message } = require('../models/User') 
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.get('/user/:id', async (req, res) => {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send({error: "User not found"})

    res.send({name: user.name, email: user.email, _id: user._id})
})

router.get('/users', async (req, res) => {
    const users = await User.find()
    if (!users) return res.status(404).send({error: "No Users"})

    res.json(users)
})

router.post('/signup', async (req, res) => {

    const invalidEmail = await User.findOne({email: req.body.email})
    if (invalidEmail) return res.status(400).send({error: "Email already in use"})
    
    const hashPassword = bcrypt.hashSync(req.body.password, 10)

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        _id: new mongoose.Types.ObjectId,
    })

    const savedUser = await user.save()
    if (!savedUser) return res.status(400).send({error: "Error: User not saved"})

    res.send({name: savedUser.name, email: savedUser.email, _id: savedUser._id})
})

router.post('/login', async (req, res) => {
    
    const user = await User.findOne({email: req.body.email})
    if (!user) return res.status(404).send({error: "Email/Password Invalid"})

    const validPassword = await bcrypt.compareSync(req.body.password, user.password)
    if (!validPassword) return res.status(404).send({error: "Email/Password Invalid"})

    res.send({name: user.name, email: user.email, friends: user.friends, _id: user._id})
})

router.post('/user/:id/message', async (req, res) => {

    const message = new Message({
        user: req.params.id,
        text: req.body.text
    })

    const recip = req.body.recipId
    
    message.recipients.push(recip)
    const savedMessage = await message.save()
    if (!savedMessage) return res.status(400).send({error: "Error: message not saved"})
    
    res.json(savedMessage)
})

router.get('/user/:id/messages', async (req, res) => {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send({error: "No User"})

    const messages = await Message.find({user: user._id})
    if (!messages) return res.send({error: "No messages"})

    res.json(messages)

})

module.exports = router