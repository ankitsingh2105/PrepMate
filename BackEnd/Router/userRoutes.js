const express = require("express");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {handleUserInfo} = require("../Controller/userController/userController");
const User = require("../Model/userModel");
const verifyUserMiddleware = require("../middleWare/verifyUser")
const router = express.Router();

router.get("/getInfo", verifyUserMiddleware, handleUserInfo);

module.exports = router;