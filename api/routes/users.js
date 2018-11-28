const express = require('express')
const router = express.Router()
const tokenCheck = require('../middlewares/token-check')
const usersController = require("../controllers/users")

router.get("/", tokenCheck, usersController.getAll)

router.post("/register", usersController.register)

router.get("/activate/:id", usersController.verify)

router.post("/login", usersController.login)

router.get("/:id", tokenCheck, usersController.getOne)

router.patch("/:id", tokenCheck, usersController.change)

router.delete("/:id", tokenCheck, usersController.delete)

module.exports = router