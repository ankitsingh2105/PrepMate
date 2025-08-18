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

// assuming io is already defined
const interviewNamespace = io.of("/interview");

const socketToRoom = new Map();
const roomUsers = new Map();
const socketToUser = new Map();

interviewNamespace.on("connection", (socket) => {
  console.log(`🔌 Socket ${socket.id} connected`);

  socket.on("room:join", ({ email, room, name }) => {
    if (!email || !room || !name) {
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


// Code Edit namespace
codeEditNamespace.on("connection", (socket) => {
  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.to(room).emit("newUserJoin", { newUserId: socket.id })
    console.log("opo- > ", socket.id);
  });

  socket.on("user:codeChange", ({ room, sourceCode, socketId }) => {
    console.log("op ankit:: ", socketId);
    codeEditNamespace.to(room).emit("user:codeChangeAccepted", { sourceCode, senderSocketId: socketId });
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
  console.log("🚀 Server and WebSocket listening on port 3000");
});