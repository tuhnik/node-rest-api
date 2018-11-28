const mongoose = require('mongoose')


const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, required: true, match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/},
    password: {type: String, required: true},
    activated: Boolean,
    activationCode: {type: String},
    logins: []
}, {timestamps: true})

userSchema.index({createdAt: 1}, {expireAfterSeconds: 60, partialFilterExpression : {activated: false}});

module.exports = mongoose.model('User', userSchema) 