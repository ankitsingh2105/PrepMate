const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

// Routes
const loginRouter = require("./Router/login");
const signupRouter = require("./Router/signup");
const userRouter = require("./Router/userRoutes");
const connect = require("./connect");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://prep-mate-one.vercel.app", "https://prepmatee.vercel.app"],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://prep-mate-one.vercel.app", "https://prepmatee.vercel.app"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect DB
connect("mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

app.get("/", (req, res) => {
  res.send("API is working");
});

app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/user", userRouter);

// Socket.IO namespaces
const codeEditNamespace = io.of("/code-edit");
const notificationNamespace = io.of("/notification");

// todo :: interview namespace
const roomUsers = new Map(); // Map to store users in each room

 
// Code Edit namespace
codeEditNamespace.on("connection", (socket) => {
  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.to(room).emit("newUserJoin", {newUserId : socket.id})
    console.log("opo- > " , socket.id);
  });

  socket.on("user:codeChange", ({ room, sourceCode, socketId }) => {
    console.log("op ankit:: " , socketId);
    codeEditNamespace.to(room).emit("user:codeChangeAccepted", { sourceCode, senderSocketId : socketId });
  });

  socket.on("getOutput", ({ decodedOutput, room }) => {
    codeEditNamespace.to(room).emit("getOutput", { decodedOutput });
  });
});

// Notification namespace
let userSocketMap = new Map();

notificationNamespace.on("connection", (socket) => {
  socket.on('register', (userId) => {
    userSocketMap.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    for (const [userId, sockId] of userSocketMap.entries()) {
      if (sockId === socket.id) userSocketMap.delete(userId);
    }
  });

  socket.on("notification", ({ message, otherUserId }) => {
    const otherUserSocketId = userSocketMap.get(otherUserId);
    if (otherUserSocketId) {
      notificationNamespace.to(otherUserSocketId).emit("notification", { message });
    }
  });
});

// Start server
server.listen(3000, () => {
  console.log("Server and WebSocket listening on port 3000");
});