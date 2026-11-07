const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {

    console.log("Connected:", socket.id);

    socket.emit("join-battle", "battle_101", (response) => {

        console.log("Join response:", response);

    });

});

// Player joined notification
socket.on("player-joined", (data) => {

    console.log("Battle notification:", data);

});

// Battle ready notification
socket.on("battle-ready", (data) => {

    console.log("Battle ready:", data.message);

});

// Opponent disconnection
socket.on("opponent-disconnected", (data) => {

    console.log("Opponent disconnected:", data.message);

});

// Socket disconnection
socket.on("disconnect", (reason) => {

    console.log("Disconnected from server:", reason);

});
