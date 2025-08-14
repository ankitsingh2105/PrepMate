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
const interviewNamespace = io.of("/interview");
const codeEditNamespace = io.of("/code-edit");
const notificationNamespace = io.of("/notification");

// todo :: interview namespace
const roomUsers = new Map(); // Map to store users in each room
const socketToRoom = new Map(); // Map to track which room each socket is in

interviewNamespace.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected to interview namespace`);

  socket.on("room:join", ({ email, room, name }) => {
    const data = { email, socketID: socket.id, name };
    
    // Leave previous room if any
    const previousRoom = socketToRoom.get(socket.id);
    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      const prevRoomUsers = roomUsers.get(previousRoom);
      if (prevRoomUsers) {
        prevRoomUsers.delete(socket.id);
        if (prevRoomUsers.size === 0) {
          roomUsers.delete(previousRoom);
        } else {
          // Notify other users in previous room
          socket.to(previousRoom).emit("user:left", { socketID: socket.id });
        }
      }
    }

    // Join new room
    socket.join(room);
    socketToRoom.set(socket.id, room);

    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Set());
    }
    
    const roomUserSet = roomUsers.get(room);
    
    // Check if room is full
    if (roomUserSet.size >= 2) {
      console.log(`Room ${room} is full, rejecting ${email}`);
      socket.emit("room:full", { message: "Room is full" });
      socket.leave(room);
      socketToRoom.delete(socket.id);
      return;
    }

    // Add user to room
    roomUserSet.add(socket.id);
    
    console.log(`User ${email} joined room ${room} with socketID ${socket.id}`);
    console.log(`Room ${room} now has ${roomUserSet.size} users:`, Array.from(roomUserSet));

    // Notify other users in the room
    const otherUsers = Array.from(roomUserSet).filter(id => id !== socket.id);
    if (otherUsers.length > 0) {
      const targetSocketId = otherUsers[0]; 
      interviewNamespace.to(targetSocketId).emit("user:joined", data);
      console.log(`Notified ${targetSocketId} that ${email} joined`);
    }
  });

  socket.on("user:call", ({ sendername, to, offer }) => {
    console.log(`Call from ${sendername} (${socket.id}) to ${to}`);
    interviewNamespace.to(to).emit("incoming:call", { sendername, from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    console.log(`Call accepted from ${socket.id} to ${to}`);
    interviewNamespace.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log(`Negotiation needed from ${socket.id} to ${to}`);
    interviewNamespace.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log(`Negotiation done from ${socket.id} to ${to}`);
    interviewNamespace.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("ice:candidate", ({ to, candidate }) => {
    console.log(`ICE candidate from ${socket.id} to ${to}`);
    interviewNamespace.to(to).emit("ice:candidate", { candidate });
  });

  // Handle room leave explicitly
  socket.on("room:leave", () => {
    const room = socketToRoom.get(socket.id);
    if (room) {
      console.log(`Socket ${socket.id} explicitly leaving room ${room}`);
      socket.leave(room);
      
      const roomUserSet = roomUsers.get(room);
      if (roomUserSet) {
        roomUserSet.delete(socket.id);
        if (roomUserSet.size === 0) {
          roomUsers.delete(room);
        } else {
          socket.to(room).emit("user:left", { socketID: socket.id });
        }
      }
      socketToRoom.delete(socket.id);
    }
  });

  // Heartbeat to detect disconnections
  socket.on("heartbeat", () => {
    socket.emit("heartbeat:ack");
  });

  // Set up heartbeat interval
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit("heartbeat");
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // 30 seconds

  // Clean up interval on disconnect
  socket.on("disconnect", () => {
    clearInterval(heartbeatInterval);
    
    console.log(`Socket ${socket.id} disconnected`);
    
    // Find and clean up the room this socket was in
    const room = socketToRoom.get(socket.id);
    if (room) {
      const roomUserSet = roomUsers.get(room);
      if (roomUserSet) {
        roomUserSet.delete(socket.id);
        console.log(`Removed ${socket.id} from room ${room}`);
        
        // Notify other users in the room
        if (roomUserSet.size > 0) {
          socket.to(room).emit("user:left", { socketID: socket.id });
          console.log(`Notified other users in room ${room} that ${socket.id} left`);
        } else {
          // Room is empty, clean it up
          roomUsers.delete(room);
          console.log(`Room ${room} is now empty, cleaned up`);
        }
      }
      socketToRoom.delete(socket.id);
    }
    
    console.log("Current room state:", Object.fromEntries(
      Array.from(roomUsers.entries()).map(([room, users]) => [room, Array.from(users)])
    ));
  });
});
 
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