const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("join-battle", "battle_101");
});

socket.on("player-joined", (data) => {
    console.log("Battle notification:", data);
});


socket.on("room-full", (data) => {
    console.log("Room full:", data.message);
});

socket.on("battle-ready", (data) => {
    console.log("Battle ready:", data.message);
});