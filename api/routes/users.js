const express = require('express')
const router = express.Router()
const tokenCheck = require('../middlewares/token-check')
const usersController = require("../controllers/users")

router.get("/", tokenCheck, usersController.getAll)

router.post("/register", usersController.register)

router.get("/activate/:token", usersController.activate)

router.post("/login", usersController.login)

router.get("/:id", tokenCheck, usersController.getOne)

router.patch("/:id", tokenCheck, usersController.change)

router.delete("/:id", tokenCheck, usersController.delete)

router.post("/forgotpassword", usersController.forgotPassword)

router.post("/checkresettoken/:email/:token", usersController.checkResetToken)

router.post("/resetpassword", usersController.resetPassword)

module.exports = router