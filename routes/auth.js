const router = require('express').Router()
const { User, Message } = require('../models/User') 
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// GET USERS

router.get('/user/:id', async (req, res) => {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send({error: "User not found"})

    const userObj = {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages
    }

    res.send(userObj)
})

router.get('/users', async (req, res) => {
    const users = await User.find()
    if (!users) return res.status(404).send({error: "No Users"})

    res.json(users)
})

// SIGNUP, LOGIN, VALIDATE

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

    const token = await jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
    if (!token) return res.status(400).send({error: "No token"})

    const userObj = {
        _id: savedUser._id, 
        name: savedUser.name, 
        email: savedUser.email, 
        token: token,
    }

    res.send(userObj)
})

router.post('/login', async (req, res) => {
    
    const user = await User.findOne({email: req.body.email})
    if (!user) return res.status(404).send({error: "Email/Password Invalid"})

    const validPassword = await bcrypt.compareSync(req.body.password, user.password)
    if (!validPassword) return res.status(404).send({error: "Email/Password Invalid"})

    const token = await jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
    if (!token) return res.status(400).send({error: "No token"})

    const userObj = {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages,
        token: token
    }

    res.send(userObj)
})

router.get('/validate', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id)
    if (!user) return res.status(404).send({error: "User not found"})

    const token = await jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
    if (!token) return res.status(400).send({error: "No token"})

    const userObj = {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages,
        token: token
    }

    res.send(userObj)
})

// USER MESSAGES

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

// USER FRIENDS

router.get('/friends', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id).populate('friends', 'name email')
    if (!user) return res.status(404).send({error: "No User"})

    res.json(user.friends)
})

router.patch('/:id/friend', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id).populate('friends', 'name email')
    if (!user) return res.status(404).send({error: "No user found"})

    user.friends.push(req.body.friendId)
    const savedUser = await user.save()
    if (!savedUser) return res.status(400).send({error: "Friend not saved"})

    res.json(user.friends)
})

// SEARCH 

router.get('/search/:query', async (req, res) => {
    const pattern = new RegExp(req.params.query, "i")
    const results = await User.find({name: pattern})
    if (!results) return res.status(400).send({error: "No Users Found"})

    res.json(results)
})

module.exports = router