const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
require('dotenv').config({ quiet: true });
const startWorker = require("./consumers/bookingWorker");

// Routes
const loginRouter = require("./Router/login");
const signupRouter = require("./Router/signup");
const userRouter = require("./Router/userRoutes");
const connect = require("./config/mongodbAtlas");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://prep-mate-one.vercel.app",
      "https://prepmatee.vercel.app",
      "http://192.168.0.100:5173"
    ],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// Middlewares
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://prep-mate-one.vercel.app",
    "https://prepmatee.vercel.app",
    "http://192.168.0.100:5173"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect DB
connect(process.env.MONGODB_ATLAS_URI);

// Routes
app.get("/", (req, res) => res.send("API is working"));
app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/user", userRouter);

// Namespaces
const interviewNamespace = io.of("/interview");
const codeEditNamespace = io.of("/code-edit");
const notificationNamespace = io.of("/notification");

const socketToRoom = new Map();
const roomUsers = new Map();
const socketToUser = new Map();

// ---------------- INTERVIEW NAMESPACE ----------------
interviewNamespace.on("connection", (socket) => {
  console.log(`🔌 Socket ${socket.id} connected`);

  socket.on("room:join", ({ email, room, name }) => {
    console.log(email, room, name);
    if (!email || !room || !name) {
      console.log("some error");
      socket.emit("room:error", { message: "Invalid data" });
      return;
    }

    socket.join(room);
    socketToRoom.set(socket.id, room);
    socketToUser.set(socket.id, { email, name });

    if (!roomUsers.has(room)) roomUsers.set(room, new Set());
    const roomSet = roomUsers.get(room);

    if (roomSet.size >= 2) {
      socket.emit("room:full", { message: "Room is full" });
      socket.leave(room);
      socketToRoom.delete(socket.id);
      socketToUser.delete(socket.id);
      return;
    }

    roomSet.add(socket.id);

    // Notify others
    const otherUsers = Array.from(roomSet).filter(id => id !== socket.id);
    console.log("otherUser :: ", otherUsers);
    if (otherUsers.length > 0) {
      interviewNamespace.to(otherUsers[0]).emit("user:joined", { email, socketID: socket.id, name });
    }

    socket.emit("room:joined", { room, users: Array.from(roomSet) });
  });

  socket.on("user:call", ({ to, offer }) => {
    interviewNamespace.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, answer }) => {
    interviewNamespace.to(to).emit("call:accepted", { from: socket.id, answer });
  });

  socket.on("ice:candidate", ({ to, candidate }) => {
    interviewNamespace.to(to).emit("ice:candidate", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    const room = socketToRoom.get(socket.id);
    if (room) {
      const roomSet = roomUsers.get(room);
      if (roomSet) {
        roomSet.delete(socket.id);
        if (roomSet.size === 0) roomUsers.delete(room);
        else socket.to(room).emit("user:left", { socketID: socket.id });
      }
      socketToRoom.delete(socket.id);
      socketToUser.delete(socket.id);
    }
    console.log(`🔌 Socket ${socket.id} disconnected`);
  });
});

// ---------------- CODE EDIT NAMESPACE ----------------
codeEditNamespace.on("connection", (socket) => {
  socket.on("joinRoom", (room) => {
    console.log("user joinedn the coding space :: ", room, " :: ", socket.id)
    socket.join(room);
    socket.to(room).emit("newUserJoin", { newUserId: socket.id });
  });

  socket.on("user:codeChange", ({ room, sourceCode, socketId }) => {
    codeEditNamespace.to(room).emit("user:codeChangeAccepted", { sourceCode, senderSocketId: socketId });
  });

  socket.on("getOutput", ({ decodedOutput, room }) => {
    codeEditNamespace.to(room).emit("getOutput", { decodedOutput });
  });
});

// ---------------- NOTIFICATION NAMESPACE ----------------
const userSocketMap = new Map();
notificationNamespace.on("connection", (socket) => {
  socket.on("register", (userId) => {
    userSocketMap.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
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

// ---------------- START SERVER ---------------
const PORT = process.env.PORT;
server.listen(PORT, () => {
  startWorker()
    .then(() => console.log("Booking worker started"))
    .catch(err => console.error("Worker failed to start:", err));
  console.log(`Server running on port ${PORT}`);
}); 
