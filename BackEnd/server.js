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
const mockModel = require("./Model/mockModel");

const io = new Server(8000, {
  cors: true
});

// middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://prep-mate-one.vercel.app"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

connect("mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
// connect("mongodb://127.0.0.1:27017/PrepMate");

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

  socket.on("room:join", ({ email, room }) => {
    const data = { email, room, socketID: socket.id };

    socket.join(room);

    // sending message to the room 
    io.to(room).emit("user:joined", data);

    // send room join confirmation to the user who joined
    io.to(socket.id).emit("room:join", data);

  });

  // Listens for incoming call requests from other users
  socket.on("user:call", ({ sendername, to, offer }) => {
    // Emit the incoming call event to the specified remote user
    io.to(to).emit("incoming:call", { sendername, from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  })

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  })

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  })

});

// socket connection for code edit
const ioForCodeEdit = new Server(9000, {
  cors: true
});

ioForCodeEdit.on("connection", (socket) => {

  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("user:codeChange", ({ room, sourceCode }) => {
    ioForCodeEdit.to(room).emit("user:codeChangeAccepted", { sourceCode });
  })

  socket.on("getOutput", ({ decodedOutput, room }) => {
    console.log(decodedOutput);
    ioForCodeEdit.to(room).emit("getOutput", { decodedOutput });
  })

})

// socket server for notification
const ioForNotification = new Server(9001, {
  cors: true
})

let userSocketMap = new Map();

ioForNotification.on("connection", (socket) => {
  console.log('User connected: ' + socket.id);

  socket.on('register', (userId) => {
    // Map userId to socketId in your map
    userSocketMap.set(userId, socket.id);
    console.log(userSocketMap);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
    // Remove the mapping on disconnect if necessary
    userSocketMap.delete(socket.id);
  });

  socket.on("notification", ({ message, otherUserId }) => {
    console.log("Notification received", message, otherUserId);
    console.log("userSocketMap", userSocketMap);

    const otherUserSocketId = userSocketMap.get(otherUserId);
    console.log("opo >> ", otherUserSocketId);

    if (otherUserSocketId) {
      console.log("sending message");
      ioForNotification.to(otherUserSocketId).emit("notification", { message });
    }
    else {
      console.log(`User with ID ${otherUserId} is not connected.`);
    }
  })
});  