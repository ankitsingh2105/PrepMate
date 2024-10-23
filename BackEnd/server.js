const express = require("express")
const app = express();
const cors = require("cors");
// routes
const loginRouter = require("./Router/login");
const signupRouter = require("./Router/signup");

const cookieParser = require("cookie-parser");

const connect = require("./connect");

// middlewares
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

connect("mongodb://127.0.0.1:27017/PrepMate");

app.get("", (req, response) => {
    response.send("Api is working")
})

app.use("/login", loginRouter);
app.use("/signup", signupRouter);

app.listen(3000, () => {
    console.log("listening to port 3000");
})