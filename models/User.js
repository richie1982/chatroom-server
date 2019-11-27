const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String
    },
    email : {
        type: String
    },
    password: {
        type: String
    },
    messages: [
        {
            type: Schema.Types.ObjectID,
            ref: 'Message'
        }
    ],
    friends: [ 
        {
            type: Schema.Types.ObjectID,
            ref: 'User'
        }
    ],
    pending: [
        {
            type: Schema.Types.ObjectID,
            ref: 'User'
        }
    ],
    invites: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

const messageSchema = new Schema({
    users: [
        {
            type: Schema.Types.ObjectID,
            ref: 'User'
        }
    ],
    messages: [
        { 
            author: {
                type: Schema.Types.ObjectID,
                ref: 'User'
            },
            text: { type: String },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
})

module.exports.User = mongoose.model('User', userSchema)
module.exports.Message = mongoose.model('Message', messageSchema)