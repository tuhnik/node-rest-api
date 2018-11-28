const User = require('../models/user')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.getAll = (req, res)=>{
    User.find({}).select('email activated').exec()
    .then(users=>{
        const response = {
            count: users.length,
            users
        }
        res.status(200).json(response)
    })
    .catch(err => {
        res.status(500).json({error: err})
    })  
}

exports.register = (req, res, next)=>{
    User.findOne({email: req.body.email}).then(user => {
        if(user) {
            res.status(409).json({ message: "Email already in use"})
        }
        else {
            bcrypt.hash(req.body.password, 10, (err, hash)=>{
                if(err) {
                    return next(err)
                }
                else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        password: hash,
                        activationCode: jwt.sign({email: req.body.email}, process.env.JWT_KEY, {expiresIn: "1h"}),
                        activated: false
                    })
                    user.save().then(result => {  
                        const response = {
                            message: 'User created',
                            user: {
                                email: result.email,
                                activated: result.activated
                            }
                        }
                        //TODO email sending logic
                        res.status(201).json(response)
                    })
                    .catch(err => {
                        res.status(500).json({error: err})
                    })
                }
            })
        }
    }).catch()
   
}

exports.login = (req, res, next)=>{
    User.findOne({email: req.body.email}).exec().then(user=>{
        if(!user){
            return res.status(401).json({message: "Authentication failed"})
        }
        // if(!user.activated){
        //     return res.status(401).json({message: "User is not activated"})
        // }
        bcrypt.compare(req.body.password, user.password, (err, result)=>{
            if(err) {
                return res.status(401).json({message: "Authentication failed"})
            }
            if(result) {
                const token = jwt.sign({email: user.email, id: user._id}, process.env.JWT_KEY, {expiresIn: "24h"})
                return res.status(200).json({message: "Authenticated", token})
            }
            return res.status(401).json({message: "Authentication failed"})
        })
        
    }).catch()
}

exports.getOne = (req, res)=>{
    let id = req.params.id
    User.findById(id).select('email activated').then(doc => {
        if (doc) {
            res.status(200).json(doc)
        } else {
            res.status(404).json({message: "Not found"})
        }     
    })
    .catch(err => {
        res.status(500).json({error: err})
    })
}

exports.change = (req, res)=>{
    const id = req.params.id
    const updateOpts = {}
    for (const opts of req.body) {
        updateOpts[opts.propName] = opts.value
    }
    User.update({_id: id}, { $set: updateOpts}).exec().then(result=>{
        res.status(200).json({result})
    }).catch(err=>{
        res.status(500).json({error: err})
    })
}

exports.delete = (req, res)=>{
    const id = req.params.id
    User.deleteOne({_id: id}).exec().then(result => {
        res.status(200).json({message: "Delete operation successful"})
    })
    .catch(err=>{
        res.status(500).json({error: err})
    })
}

exports.activate = (req, res)=>{
    const token = req.params.token

    jwt.verify(token, process.env.JWT_KEY, (err, result)=>{
        if(!result) {
            res.status(401).json({error: "Invalid token"})
        }
        else {       
            User.updateOne({email: result.email}, {$set: {activated: true}}).exec().then(result=>{
                res.status(200).json({message: "Email verified"})
            }).catch(err => {
                res.status(500).json({error: err.message})
            })          
        }
    })
}