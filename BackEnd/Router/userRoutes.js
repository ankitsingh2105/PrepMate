const express = require("express");
const router = express.Router();
const verifyUserMiddleware = require("../middleWare/verifyUser")
const {handleUserInfo, handleUserLogout, handleAvailability} = require("../Controller/userController/userController");

router.get("/getInfo", verifyUserMiddleware, handleUserInfo);
router.get("/logout" , verifyUserMiddleware, handleUserLogout);
router.post("/checkAvailability" , verifyUserMiddleware, handleAvailability);

module.exports = router;