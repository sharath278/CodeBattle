
const registerBattleHandlers = require("./battleSocket");

const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        // Register battle events
        registerBattleHandlers(io, socket);

        socket.on("disconnect", (reason) => {
            console.log("User disconnected:", socket.id);
            console.log("Reason:", reason);
        });

    });

};

module.exports = initializeSocket;
