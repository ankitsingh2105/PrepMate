const express = require("express")
const app = express();
const cors = require("cors");
// routes
const loginRouter = require("./Router/login");
const signupRouter = require("./Router/signup");
const userRouter = require("./Router/userRoutes")

const cookieParser = require("cookie-parser");

const connect = require("./connect");

const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true 
}); 
 
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
app.use("/user", userRouter);

app.listen(3000, () => {
    console.log("listening to port 3000");
})




io.on("connection", (socket) => {
  console.log("new user is here :: ", socket.id);

  socket.on("room:join", ({ email, room }) => {
    console.log("email room and socketID is :: ", email, room, socket.id);
    const data = { email, room, socketID: socket.id };
 
    // joining the room  
    socket.join(room);  // Pass the room name here
 
    // sending message to the room 
    io.to(room).emit("user:joined", data);

    // send room join confirmation to the user who joined
    io.to(socket.id).emit("room:join", data);

  });     


  //todo:: Listens for incoming call requests from other users
  socket.on("user:call", ({ sendername, to, offer }) => {
    console.log("Incoming call sent to", to, "from", socket.id);

    // Emit the incoming call event to the specified remote user
    // Forward the call request with the offer to the remote user
    io.to(to).emit("incoming:call", {sendername, from: socket.id, offer });
  });


  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", ({ from: socket.id, ans }));
  })


  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  })

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, offer });
  })
 
});
 