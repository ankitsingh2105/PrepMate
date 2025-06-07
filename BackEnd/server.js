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

const server = http.createServer(app); // Combine Express + Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://prep-mate-one.vercel.app"],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://prep-mate-one.vercel.app"],
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
const interviewNamespace = io.of("/interview");
const codeEditNamespace = io.of("/code-edit");
const notificationNamespace = io.of("/notification");

// Interview (WebRTC) namespace
interviewNamespace.on("connection", (socket) => {
  socket.on("room:join", ({ email, room }) => {
    const data = { email, room, socketID: socket.id };
    socket.join(room);
    interviewNamespace.to(room).emit("user:joined", data);
    interviewNamespace.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ sendername, to, offer }) => {
    interviewNamespace.to(to).emit("incoming:call", { sendername, from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    interviewNamespace.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    interviewNamespace.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    interviewNamespace.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

// Code Edit namespace
codeEditNamespace.on("connection", (socket) => {
  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("user:codeChange", ({ room, sourceCode }) => {
    codeEditNamespace.to(room).emit("user:codeChangeAccepted", { sourceCode });
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
