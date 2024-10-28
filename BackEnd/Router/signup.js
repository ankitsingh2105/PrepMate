const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../Model/userModel");

const router = express.Router();

router.post("/", async (req, res) => {
    const { userName, email, password, name } = req.body;
    console.log("Registering User:", userName, email);

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        user = new User({
            userName,
            email,
            password, 
            name
        });

        // todo :: Hashing the password before saving the user
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const token = jwt.sign({ userName: userName }, 'ankit', { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: false,  // Set to true if you're using HTTPS
        });
        console.log("user added cookie send");
        res.status(201).json({
            message: "SignUp successfull",
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
