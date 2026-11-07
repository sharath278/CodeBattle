
const crypto = require("crypto");

// Shared across all connected sockets
const activeBattles = new Set();

const registerBattleHandlers = (io, socket) => {

    // CREATE BATTLE
    socket.on("create-battle", (callback) => {

        const roomId =
            "CB" + crypto.randomBytes(3).toString("hex").toUpperCase();

        activeBattles.add(roomId);

        socket.join(roomId);
        socket.data.activeBattle = roomId;

        console.log("Battle created:", roomId);

        callback({
            success: true,
            roomId
        });
    });


    // JOIN BATTLE
    socket.on("join-battle", (roomId, callback) => {

        // Normalize room code
        if (typeof roomId !== "string") {
            callback({
                success: false,
                message: "Invalid battle code!"
            });
            return;
        }

        roomId = roomId.trim().toUpperCase();

        // Check whether battle exists
        if (!activeBattles.has(roomId)) {
            callback({
                success: false,
                message: "Battle room not found!"
            });
            return;
        }

        // Get current room
        const room = io.sockets.adapter.rooms.get(roomId);
        const playerCount = room ? room.size : 0;

        // Check creator connection
        if (playerCount === 0) {
            callback({
                success: false,
                message: "Battle creator is no longer in the room!"
            });
            return;
        }

        // Check room capacity
        if (playerCount >= 2) {
            callback({
                success: false,
                message: "Battle room is already full!"
            });
            return;
        }

        // Join room
        socket.join(roomId);
        socket.data.activeBattle = roomId;

        // Updated player count
        const players = io.sockets.adapter.rooms.get(roomId).size;

        // Notify players
        io.to(roomId).emit("player-joined", {
            playerId: socket.id,
            playerCount: players
        });

        // Battle ready notification
        if (players === 2) {
            io.to(roomId).emit("battle-ready", {
                message: "Both players joined. Battle is ready!",
                roomId
            });
        }

        console.log(`${socket.id} joined ${roomId}`);

        callback({
            success: true,
            message: "Successfully joined battle!",
            roomId,
            playerCount: players
        });
    });


    // OPPONENT DISCONNECTING
    socket.on("disconnecting", () => {

        const roomId = socket.data.activeBattle;

        if (!roomId) return;

        socket.to(roomId).emit("opponent-disconnected", {
            message: "Your opponent disconnected!",
            playerId: socket.id
        });
    });

};

module.exports = registerBattleHandlers;
