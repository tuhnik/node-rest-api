const jwt = require('jsonwebtoken')
const User = require('../models/user')

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_KEY)  
        req.userData = decoded
        User.findOne({email: decoded.email}).then(user => {
            if(user) {
                next()
            }
            else {
                res.status(401).json({error: 'Authentication failed'})
            }
        })

    } catch (error) {
        return res.status(401).json({
            error: 'Authentication failed'
        })
    }
    
}