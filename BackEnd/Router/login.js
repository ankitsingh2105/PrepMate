const express = require("express");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../Model/userModel");

const router = express.Router();

router.post("/", async (req, response) => {
    const { userName, password } = req.body;
    console.log(userName, password);
    try {
        const user = await User.findOne({ userName });
        if (!user) {
            return response.status(400).json({
                message: "User does not exist"
            })
        }
        const isMatch = await bycrypt.compare(password, user.password);

        if (!isMatch) {
            return response.status(400).json({
                message: "Invalid Credentials",
            })
        }

        const token = jwt.sign({ userName: userName }, 'ankit', { expiresIn: '1d' });

        // httpOnly: true, // * :: Prevents client-side JavaScript from accessing the cookie
        response.cookie('token', token, {
            httpOnly: true,
            sameSite: "None",
            secure : true
        });

        response.json({
            message: "Logged In Successfully"
        })

    }
    catch (error) {
        console.error(error);
        response.status(500).send('Server error');
    }
})

module.exports = router;