// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React dev URL
    methods: ["GET", "POST"],
  },
});

const userSockets = {}; // { username: socketId }

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/e2ee_system")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB error:", err);
  });

// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Secure E2EE backend running" });
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, password, publicKey } = req.body;
    if (!username || !password || !publicKey) {
      return res.status(400).json({ error: "All fields required" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = new User({
      username,
      passwordHash,
      publicKey,        // 🔐 identity public key, base64 SPKI
      createdAt: new Date(),
    });
    await user.save();
    res.json({ message: "User registered securely ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/register-public-key", async (req, res) => {
  try {
    const { username, publicKey } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.publicKey = publicKey;
    await user.save();

    res.json({ message: "Public key stored ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Later we can log this attempt in a dedicated log collection
    res.json({ message: "Login successful ✅", username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/public-key/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user || !user.publicKey) {
      return res.status(404).json({ error: "Public key not found" });
    }
    res.json({ publicKey: user.publicKey });
  } catch (err) {
    console.error("Public key error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Basic socket connection (no real chat yet)
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Register which user owns this socket
  socket.on("register-user", ({ username }) => {
    console.log("Registering user to socket:", username, socket.id);
    userSockets[username] = socket.id;
  });

  // Relay KX_INIT
  socket.on("kx-init", (data) => {
    const { to } = data.body || data; // depending how we send
    const targetSocketId = userSockets[to];
    console.log("Relaying kx-init from", data.body?.from, "to", to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("kx-init", data);
    }
  });

  // Relay KX_RESPONSE
  socket.on("kx-response", (data) => {
    const { to } = data.body || data;
    const targetSocketId = userSockets[to];
    console.log("Relaying kx-response from", data.body?.from, "to", to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("kx-response", data);
    }
  });

  // Relay KX_CONFIRM
  socket.on("kx-confirm", (data) => {
    const { to, from, sessionId } = data;
    const targetSocketId = userSockets[to];
    console.log(
      "Relaying kx-confirm from",
      from,
      "to",
      to,
      "sessionId=",
      sessionId
    );
    if (targetSocketId) {
      io.to(targetSocketId).emit("kx-confirm", data);
    }
  });

  socket.on("chat-message-encrypted", (data) => {
    const { to, from, sessionId } = data;
    const targetSocketId = userSockets[to];
    console.log(
      "Relaying encrypted chat message from",
      from,
      "to",
      to,
      "sessionId=",
      sessionId
    );
    if (targetSocketId) {
      io.to(targetSocketId).emit("chat-message-encrypted", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
