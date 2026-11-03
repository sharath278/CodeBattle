require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
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

// Socket connections
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-battle", (roomId) => {

        // Check existing players in the room
        const room = io.sockets.adapter.rooms.get(roomId);
        const currentPlayers = room ? room.size : 0;

        // Reject third player
        if (currentPlayers >= 2) {
            socket.emit("room-full", {
                message: "This battle room is already full!"
            });

            return;
        }

        // Join the room
        socket.join(roomId);

        const players = io.sockets.adapter.rooms.get(roomId).size;

        console.log(`${socket.id} joined ${roomId}`);

        // Notify room members
        io.to(roomId).emit("player-joined", {
            playerId: socket.id,
            playerCount: players
        });

        // Both players have joined
        if (players === 2) {
            io.to(roomId).emit("battle-ready", {
                message: "Both players joined. Battle is ready!",
                roomId
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
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