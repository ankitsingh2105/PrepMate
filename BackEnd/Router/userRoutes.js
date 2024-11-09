const express = require("express");
const router = express.Router();
const verifyUserMiddleware = require("../middleWare/verifyUser")
const { handleUserInfo, handleUserLogout, handleAvailability, handleUpdateUserInfo, handleCancelBooking } = require("../Controller/userController/userController");

router.get("/getInfo", verifyUserMiddleware, handleUserInfo);
router.get("/logout", verifyUserMiddleware, handleUserLogout);
router.post("/checkAvailability", verifyUserMiddleware, handleAvailability);
router.patch("/updateInformation", verifyUserMiddleware, handleUpdateUserInfo);
router.post("/cancelBooking", verifyUserMiddleware, handleCancelBooking);

module.exports = router;