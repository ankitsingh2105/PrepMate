const express = require("express");
const router = express.Router();
const verifyUserMiddleware = require("../middleWare/verifyUser")
const {handleUserInfo, handleUserLogout} = require("../Controller/userController/userController");

router.get("/getInfo", verifyUserMiddleware, handleUserInfo);
router.get("/logout" , verifyUserMiddleware, handleUserLogout);

module.exports = router;