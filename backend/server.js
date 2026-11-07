
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const crypto = require("crypto");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

// HTTP route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to CodeBattle API"
    });
});

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const activeBattles = new Set();


// Socket.IO connection
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    //create battle 
    socket.on("create-battle", (callback) => {

    const roomId = "CB" + crypto.randomBytes(3).toString("hex").toUpperCase();

    activeBattles.add(roomId);

    socket.join(roomId);

    socket.data.activeBattle = roomId;

    console.log("Battle created:", roomId);

    callback({
        success: true,
        roomId
    });

});

  // join battle 
  
socket.on("join-battle", (roomId, callback) => {

    // 1. Normalize room code
    roomId = roomId.trim().toUpperCase();

    // 2. Check whether the battle exists
    if (!activeBattles.has(roomId)) {
        callback({
            success: false,
            message: "Battle room not found!"
        });
        return;
    }

    // 3. Get current room and player count
    const room = io.sockets.adapter.rooms.get(roomId);
    const playerCount = room ? room.size : 0;

    // 4. Check whether creator is still connected
    if (playerCount === 0) {
        callback({
            success: false,
            message: "Battle creator is no longer in the room!"
        });
        return;
    }

    // 5. Check room capacity
    if (playerCount >= 2) {
        callback({
            success: false,
            message: "Battle room is already full!"
        });
        return;
    }

    // 6. Join the room
    socket.join(roomId);
    socket.data.activeBattle = roomId;

    // 7. Get updated player count
    const players = io.sockets.adapter.rooms.get(roomId).size;

    // 8. Notify all players about the new player
    io.to(roomId).emit("player-joined", {
        playerId: socket.id,
        playerCount: players
    });

    // 9. Notify both players when room is full
    if (players === 2) {
        io.to(roomId).emit("battle-ready", {
            message: "Both players joined. Battle is ready!",
            roomId
        });
    }

    console.log(`${socket.id} joined ${roomId}`);

    // 10. Send acknowledgement to joining player
    callback({
        success: true,
        message: "Successfully joined battle!",
        roomId,
        playerCount: players
    });

});





   // disconnecting hanlder
    socket.on("disconnecting", () => {

    const roomId = socket.data.activeBattle;

    if (!roomId) return;

    socket.to(roomId).emit("opponent-disconnected", {
        message: "Your opponent disconnected!",
        playerId: socket.id
    });

});

    

    socket.on("disconnect", (reason) => {
        console.log("User disconnected:", socket.id);
        console.log("Reason:", reason);
    });

});

// Start server
const startServer = async () => {
    try {

        await connectDB();

        const PORT = process.env.PORT || 5000;

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
