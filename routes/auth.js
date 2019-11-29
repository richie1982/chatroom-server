const router = require('express').Router()
const { User, Message } = require('../models/User') 
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// GET USERS

router.get('/user/:id', async (req, res) => {
    const user = await User.findById(req.params.id).populate({path: 'invites', select: 'name _id'})
    if (!user) return res.status(404).send({error: "User not found"})

    const userObj = {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages,
        invites: user.invites,
        pending: user.pending,
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
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages,
        invites: user.invites,
        pending: user.pending,
        token: token,
    }

    res.send(userObj)
})

router.post('/login', async (req, res) => {
    
    const user = await User.findOne({email: req.body.email}).populate({path: 'invites', select: 'name _id'})
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
        invites: user.invites,
        pending: user.pending,
        token: token
    }

    res.send(userObj)
})

router.get('/validate', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id).populate({path: 'invites', select: 'name _id'})
    if (!user) return res.status(404).send({error: "User not found"})

    const token = await jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
    if (!token) return res.status(400).send({error: "No token"})

    const userObj = {
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        friends: user.friends,
        messages: user.messages,
        invites: user.invites,
        pending: user.pending,
        token: token
    }

    res.send(userObj)
})

// USER MESSAGES

router.get('/:id/messages', async (req, res) => {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send({error: "No User"})

    const messages = await Message.find({users: user._id })
    if (!messages) return res.send({error: "No messages"})

    res.json(messages)
})

router.post('/:id/chats', async (req, res) => {
    const id = jwt.decode(req.headers.auth)

    const config = {
        path: 'messages',
        match: { users: req.body.friendId }
    }

    const user = await User.findById(id).populate(config)
    if (!user) return res.status(400).send({error: "not found"})

    res.json(user.messages)
})

router.post('/:id/message', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id)
    if (!user) return res.status(404).send({error: "No User Found"})

    const message = new Message({
        users: [ 
            user._id, 
            req.body.recipId 
        ],
        messages: [ 
            {
                author: user._id,
                text: req.body.text 
            }
        ]
    })
    
    const savedMessage = await message.save()
    if (!savedMessage) return res.status(400).send({error: "Error: message not saved"})
    
    res.json(savedMessage)
})

router.patch('/:id/messages', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id)
    if (!user) return res.status(400).send({error: "No user found"})
    
    const message = await Message.findById(req.body.msgId)
    if (!message) return res.status(400).send({error: "Message not found"})

    message.messages.push({ 
        text: req.body.text,
        author: user._id
    })

    const savedMessage = await message.save()
    if (!savedMessage) return res.status(400).send({error: "Error, message did not save"})

    res.json(savedMessage)
})

// USER FRIENDS

router.get('/friends', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id).populate('friends', 'name email _id')
    if (!user) return res.status(404).send({error: "No User"})

    res.json(user.friends)
})

router.patch('/invite', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id)
    if (!user) return res.status(404).send({error: "No user found"})

    const friend = await User.findById(req.body.friendId)
    if (!friend) return res.status(400).send({error: "No user found"})

    user.pending.push(req.body.friendId)
    friend.invites.push(user._id)

    const saved = await user.save()
    if (!saved) return res.status(400).send({error: "Friend not saved"})

    const savedFriend = await friend.save()
    if (!savedFriend) return res.status(400).send({error: "Contact not found"})

    res.send({status: "Invitation sent..."})
})

router.patch('/friend', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id).populate('friends', 'name email')
    if (!user) return res.status(404).send({error: "No user found"})

    const friend = await User.findById(req.body.friendId)
    if (!friend) return res.status(404).send({error: "No user found"})


    user.invites.pull(friend._id)
    user.friends.push(friend._id)

    friend.pending.pull(user._id)
    friend.friends.push(user._id)

    const message = new Message({
        users: [
            user._id,
            friend._id
        ]
    })

    const savedMessage = await message.save()
    if (!savedMessage) return res.status(400).send({error: "Error: message not saved"})

    user.messages.push(savedMessage._id)
    friend.messages.push(savedMessage._id)
    
    const savedUser = await user.save()
    if (!savedUser) return res.status(400).send({error: "Friend not saved"})

    const savedFriend = await friend.save()
    if (!savedFriend) return res.status(400).send({error: "Contact not found"})

    const obj = {
        friend: {
            _id: savedFriend._id,
            name: savedFriend.name,
            email: savedFriend.email
        },
        msgId: savedMessage._id
    }
 
    res.send(obj)
})

router.delete('/pending', async (req, res) => {
    const id = jwt.decode(req.headers.auth)
    const user = await User.findById(id)
    if (!user) res.status(400).send({error: "No user found"})

    const friend = await User.findById(req.body.friendId)
    if (!friend) return res.status(400).send({error: "No User found"})
    
    user.invites.pull(friend._id)
    user.save()

    friend.pending.pull(user._id)
    const savedFriend = await friend.save()

    res.send({_id: savedFriend._id})
})

// SEARCH 

router.get('/search/:query', async (req, res) => {
    const pattern = new RegExp(req.params.query, "i")
    const results = await User.find({name: pattern})
    if (!results) return res.status(400).send({error: "No Users Found"})

    res.json(results)
})

module.exports = router