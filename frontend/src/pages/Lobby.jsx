
import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import socket from "../socket";
import "../styles/Lobby.css";

function Lobby() {
    const { roomId } = useParams();
    const location = useLocation();

    const [playerCount, setPlayerCount] = useState(
        location.state?.playerCount ?? 1
    );

    const [opponentDisconnected, setOpponentDisconnected] = useState(false);

    useEffect(() => {

        // When a new player joins
        const handlePlayerJoined = (data) => {
            console.log("Player joined!");
            console.log("Total players:", data.playerCount);

            setPlayerCount(data.playerCount);
            setOpponentDisconnected(false);
        };

        // When opponent disconnects
        const handleOpponentDisconnected = (data) => {
            console.log(data.message);
            console.log("Disconnected player:", data.playerId);

            setPlayerCount(1);
            setOpponentDisconnected(true);
        };

        socket.on("player-joined", handlePlayerJoined);
        socket.on("opponent-disconnected", handleOpponentDisconnected);

        return () => {
            socket.off("player-joined", handlePlayerJoined);
            socket.off("opponent-disconnected", handleOpponentDisconnected);
        };

    }, []);

    return (
        <div className="lobby-container">

            <nav className="lobby-navbar">
                <h2>⚔️ CodeBattle</h2>
                <span>Battle Lobby</span>
            </nav>

            <main className="lobby-content">

                <div className="lobby-heading">
                    <h1>Battle Lobby</h1>
                    <p>Get ready for your coding battle!</p>
                </div>

                <div className="room-info">
                    <p>ROOM CODE</p>
                    <h2>{roomId}</h2>
                </div>

                <div className="players-container">

                    {/* Player 1 */}
                    <div className="player-card">
                        <div className="player-avatar">A</div>
                        <h2>Player 1</h2>
                        <p>Room Creator</p>

                        <span className="player-status">
                            Connected
                        </span>
                    </div>

                    <div className="versus">VS</div>

                    {/* Player 2 */}
                    <div className="player-card">
                        <div className="player-avatar">B</div>
                        <h2>Player 2</h2>
                        <p>Opponent</p>

                        <span className="player-status">
                            {opponentDisconnected
                                ? "Disconnected"
                                : playerCount === 2
                                    ? "Connected"
                                    : "Waiting"}
                        </span>
                    </div>

                </div>

                <div className="lobby-footer">

                    <p>
                        {opponentDisconnected
                            ? "Your opponent disconnected!"
                            : playerCount === 2
                                ? "Both players connected! Ready for battle."
                                : "Waiting for opponent to join..."}
                    </p>

                    <button disabled={playerCount !== 2}>
                        Start Battle
                    </button>

                </div>

            </main>

        </div>
    );
}

export default Lobby;
