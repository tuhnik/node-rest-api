const User = require('../models/user')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const transporter = require('../utils/mailsender')

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

    const email = req.body.email
    const password = req.body.password

    if(!email.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
        return res.status(500).json({error: "Invalid e-mail"})
    }

    if(email.length < 1) {
        return res.status(500).json({error: "Invalid e-mail"})
    }
    if(password.length < 6) {
        return res.status(500).json({error: "Password must be at least 6 characters!"})
    }

    User.findOne({email}).then(user => {
        if(user) { 
            return res.status(500).json({ error: "Email already in use"})
        }
        else { //TODO check if activation token expired - using MongoDB TTL for now
            bcrypt.hash(password, 10, (err, hash)=>{
                if(err) {
                    return next(err)
                }
                else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email,
                        password: hash,
                        activationCode: jwt.sign({email}, process.env.JWT_KEY, {expiresIn: "5m"}),
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
                        const opts = {
                            from: process.env.GMAIL_USER,
                            to: result.email,
                            subject: 'Welcome!',
                            html: '<p>Activate your account by clicking: http://localhost:3000/activate/' + result.activationCode + '</p>'
                          };
                        transporter.sendMail(opts, function (err, info) {
                            if(err)
                            res.status(500).json({error: "Couldn't send verification e-mail"})
                            else
                            res.status(201).json(response)
                         });

                    })
                    .catch(err => {
                        res.status(500).json({error: "Couldn't register user (invalid email)"})
                    })
                }
            })
        }
    }).catch()
   
}

exports.login = (req, res, next)=>{
    User.findOne({email: req.body.email}).exec().then(user=>{
        if(!user){
            return res.status(401).json({error: "Authentication failed"})
        }
        if(!user.activated){
            return res.status(401).json({error: "User is not activated"})
        }
        bcrypt.compare(req.body.password, user.password, (err, result)=>{
            if(err) {
                return res.status(401).json({error: "Authentication failed"})
            }
            if(result) {
                const token = jwt.sign({email: user.email, id: user._id}, process.env.JWT_KEY, {expiresIn: "24h"})
                return res.status(200).json({message: "Authenticated", token, email:user.email})
            }
            return res.status(401).json({error: "Authentication failed"})
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
            User.updateOne({email: result.email}, {$set: {activated: true}, $unset: { activationCode : 1}}).exec().then(result=>{
                if(result.n) {
                    res.status(200).json({message: "Email verified"})
                }
                else {
                    res.status(500).json({message: "Invalid token"})
                }
            }).catch(err => {
                res.status(500).json({error: err.message})
            })          
        }
    })
}

//todo password reset

exports.forgotPassword = (req, res) =>{
    const email = req.body.email

    User.findOne({email}).then(user=>{
        if(!user) {
            res.status(500).json({error: "User not found"})
        }
        else {
            res.status(200).json({message: "User found"})
            let resetCode = jwt.sign({email: user.email}, user.password, {expiresIn: "5m"})
        }
    })
    // check if email/user in db
    // create expiring jwt with password hash as secret
    // email link to user   
}

exports.resetPassword = (req, res) =>{
    const token = req.params.token
    const email = req.body.email
    const new_password = req.body.new_password
    //check if email/user in db
    //try to decode token with password hash
    //if successful, replace old password with new one (hashed)
    //email to user   
}