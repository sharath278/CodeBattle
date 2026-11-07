
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initializeSocket = require("./sockets");

const app = express();
const server = http.createServer(app);
const authRoutes = require("./routes/authRoutes");

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());


app.use("/api/auth", authRoutes);


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

// Initialize Socket.IO handlers
initializeSocket(io);

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
