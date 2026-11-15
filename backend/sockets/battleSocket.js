
const crypto = require("crypto");

// Temporary in-memory storage for active battles
const activeBattles = new Map();

// Find whether a user is already participating in a battle
const getUserActiveBattle = (userId) => {
    for (const [roomId, battle] of activeBattles) {
        if (
            battle.player1.userId === userId ||
            battle.player2?.userId === userId
        ) {
            return roomId;
        }
    }

    return null;
};

const registerBattleHandlers = (io, socket) => {

    // CREATE BATTLE
    socket.on("create-battle", (callback) => {
        if (typeof callback !== "function") return;

        const userId = socket.data.user.userId;

        const existingBattle = getUserActiveBattle(userId);

        if (existingBattle) {
            return callback({
                success: false,
                message: `You are already participating in ${existingBattle}`
            });
        }

        const roomId =
            "CB" + crypto.randomBytes(3).toString("hex").toUpperCase();

        const battle = {
            roomId,
            player1: {
                userId,
                socketId: socket.id
            },
            player2: null,
            status: "waiting",
            startedAt: null
        };

        activeBattles.set(roomId, battle);

        socket.join(roomId);
        socket.data.activeBattle = roomId;

        console.log("Battle created:", roomId);

        callback({
            success: true,
            roomId,
            playerCount: 1
        });
    });


    // JOIN BATTLE
    socket.on("join-battle", (roomId, callback) => {
        if (typeof callback !== "function") return;

        const userId = socket.data.user.userId;

        if (typeof roomId !== "string") {
            return callback({
                success: false,
                message: "Invalid battle code!"
            });
        }

        roomId = roomId.trim().toUpperCase();

        const battle = activeBattles.get(roomId);

        if (!battle) {
            return callback({
                success: false,
                message: "Battle room not found!"
            });
        }

        if (battle.player1.userId === userId) {
            return callback({
                success: false,
                message: "You cannot join your own battle!"
            });
        }

        const existingBattle = getUserActiveBattle(userId);

        if (existingBattle) {
            return callback({
                success: false,
                message: `You are already participating in ${existingBattle}`
            });
        }

        if (battle.status !== "waiting") {
            return callback({
                success: false,
                message: "This battle has already started or is unavailable!"
            });
        }

        if (battle.player2 !== null) {
            return callback({
                success: false,
                message: "Battle room is already full!"
            });
        }

        battle.player2 = {
            userId,
            socketId: socket.id
        };

        battle.status = "ready";

        socket.join(roomId);
        socket.data.activeBattle = roomId;

        io.to(roomId).emit("player-joined", {
            playerCount: 2,
            player2: userId
        });

        io.to(roomId).emit("battle-ready", {
            message: "Both players joined. Battle is ready!",
            roomId
        });

        console.log("Battle ready:", roomId);

        callback({
            success: true,
            message: "Successfully joined battle!",
            roomId,
            playerCount: 2
        });
    });


    // GET CURRENT BATTLE STATE
    socket.on("get-battle-state", (roomId, callback) => {
        if (
            typeof roomId !== "string" ||
            typeof callback !== "function"
        ) {
            return;
        }

        roomId = roomId.trim().toUpperCase();

        const battle = activeBattles.get(roomId);

        if (!battle) {
            return callback({
                success: false,
                message: "Battle room not found!"
            });
        }

        const isPlayer1 =
            battle.player1.socketId === socket.id;

        const isPlayer2 =
            battle.player2 &&
            battle.player2.socketId === socket.id;

        if (!isPlayer1 && !isPlayer2) {
            return callback({
                success: false,
                message: "You are not a member of this battle!"
            });
        }

        callback({
            success: true,
            battle: {
                roomId: battle.roomId,
                playerCount: battle.player2 ? 2 : 1,
                status: battle.status,
                player1: battle.player1.userId,
                player2: battle.player2?.userId || null,
                startedAt: battle.startedAt
            }
        });
    });


    // START BATTLE
    socket.on("start-battle", (roomId, callback) => {
        if (typeof callback !== "function") return;

        if (typeof roomId !== "string") {
            return callback({
                success: false,
                message: "Invalid battle room!"
            });
        }

        roomId = roomId.trim().toUpperCase();

        const battle = activeBattles.get(roomId);

        if (!battle) {
            return callback({
                success: false,
                message: "Battle room not found!"
            });
        }

        // Only Player 1 can start the battle
        if (battle.player1.socketId !== socket.id) {
            return callback({
                success: false,
                message: "Only the room creator can start the battle!"
            });
        }

        if (battle.status !== "ready" || !battle.player2) {
            return callback({
                success: false,
                message: "Both players must be connected before starting!"
            });
        }

        // Verify that both player sockets are still connected
        const player1Connected =
            io.sockets.sockets.has(battle.player1.socketId);

        const player2Connected =
            io.sockets.sockets.has(battle.player2.socketId);

        if (!player1Connected || !player2Connected) {
            return callback({
                success: false,
                message: "One of the players is disconnected!"
            });
        }

        battle.status = "in-progress";
        battle.startedAt = Date.now();

        const startData = {
            roomId,
            status: battle.status,
            startedAt: battle.startedAt
        };

        // Send the same start information to both players
        io.to(roomId).emit("battle-started", startData);

        console.log("Battle started:", roomId);

        callback({
            success: true,
            message: "Battle started!",
            ...startData
        });
    });


    // HANDLE DISCONNECTION
    socket.on("disconnecting", () => {
        const roomId = socket.data.activeBattle;

        if (!roomId) return;

        const battle = activeBattles.get(roomId);

        if (!battle) return;

        // If Player 1 disconnects, close the battle
        if (battle.player1.socketId === socket.id) {

            socket.to(roomId).emit("battle-closed", {
                message: "Battle creator disconnected."
            });

            activeBattles.delete(roomId);

            console.log("Battle closed:", roomId);
        }

        // If Player 2 disconnects, make the room available again
        else if (
            battle.player2 &&
            battle.player2.socketId === socket.id
        ) {

            battle.player2 = null;
            battle.status = "waiting";
            battle.startedAt = null;

            socket.to(roomId).emit("opponent-disconnected", {
                message: "Your opponent disconnected!",
                playerId: socket.id
            });

            console.log("Player 2 disconnected:", roomId);
        }

    });

};

module.exports = registerBattleHandlers;
