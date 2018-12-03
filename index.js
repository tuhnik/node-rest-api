require('./CONFIG.js')  // used for creating env variables
                        // process.env.JWT_KEY
                        // process.env.MONGODB_URL
                        // process.env.GMAIL_PASSWORD
                        // process.env.GMAIL_USER

const express = require('express')
const app = express()
const morgan = require('morgan')
const userRoutes = require('./api/routes/users')
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true) //fixing deprecation warning
const cors = require('cors')

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({extended: false})) 
app.use(express.json())

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
//     if(req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE')
//         return res.status(200).json({})
//     }
//     next()
// })

app.use('/users', userRoutes)

app.use((req, res, next)=>{
    const error = new Error("Not found")
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({error: error.message})
})
 
app.listen(5000)