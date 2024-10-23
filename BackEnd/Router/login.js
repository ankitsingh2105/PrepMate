const express = require("express");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../Model/userModel");

const router = express.Router();

router.post("/", async (req, response) => {
    console.log("logging in");
    const { userName, password, email } = req.body;
    console.log(userName, password, email);
    try {
        const user = await User.findOne({ email });
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

        const token = jwt.sign({ userId: user._id }, 'ankit', { expiresIn: '1h' });

        // httpOnly: true, // * :: Prevents client-side JavaScript from accessing the cookie
        response.cookie('token', token, {
            maxAge: 3600000,
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