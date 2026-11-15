
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
    const [battleReady, setBattleReady] = useState(false);
    const [battleClosed, setBattleClosed] = useState(false);
    const [battleStarted, setBattleStarted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handlePlayerJoined = (data) => {
            setPlayerCount(data.playerCount);
            setOpponentDisconnected(false);
            setBattleClosed(false);
        };

        const handleOpponentDisconnected = (data) => {
            console.log(data.message);

            setPlayerCount(1);
            setOpponentDisconnected(true);
            setBattleReady(false);
            setBattleStarted(false);
        };

        const handleBattleReady = (data) => {
            console.log(data.message);

            setPlayerCount(2);
            setBattleReady(true);
            setOpponentDisconnected(false);
            setBattleClosed(false);
        };

        const handleBattleClosed = (data) => {
            console.log(data.message);

            setBattleClosed(true);
            setBattleReady(false);
            setBattleStarted(false);
            setPlayerCount(1);
        };

        const handleBattleStarted = (data) => {
            console.log("Battle started:", data);

            setBattleStarted(true);
            setBattleReady(false);
        };

        // Register listeners before requesting the current state
        socket.on("player-joined", handlePlayerJoined);
        socket.on("opponent-disconnected", handleOpponentDisconnected);
        socket.on("battle-ready", handleBattleReady);
        socket.on("battle-closed", handleBattleClosed);
        socket.on("battle-started", handleBattleStarted);

        socket.emit("get-battle-state", roomId, (response) => {
            if (!response?.success) {
                console.log(
                    "Failed to get battle state:",
                    response?.message
                );
                return;
            }

            const battle = response.battle;

            setPlayerCount(battle.playerCount);
            setBattleReady(battle.status === "ready");
            setBattleStarted(battle.status === "in-progress");
            setOpponentDisconnected(false);
            setBattleClosed(false);
        });

        return () => {
            socket.off("player-joined", handlePlayerJoined);
            socket.off("opponent-disconnected", handleOpponentDisconnected);
            socket.off("battle-ready", handleBattleReady);
            socket.off("battle-closed", handleBattleClosed);
            socket.off("battle-started", handleBattleStarted);
        };

    }, [roomId]);


    const handleStartBattle = () => {
        if (loading || playerCount !== 2 || !battleReady) return;

        setLoading(true);

        socket.emit("start-battle", roomId, (response) => {
            setLoading(false);

            if (!response?.success) {
                alert(response?.message || "Unable to start battle!");
                return;
            }

            setBattleStarted(true);
            setBattleReady(false);
        });
    };


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
                            {battleClosed ? "Disconnected" : "Connected"}
                        </span>
                    </div>

                    <div className="versus">VS</div>

                    {/* Player 2 */}
                    <div className="player-card">
                        <div className="player-avatar">B</div>
                        <h2>Player 2</h2>
                        <p>Opponent</p>

                        <span className="player-status">
                            {battleStarted
                                ? "In Battle"
                                : opponentDisconnected || battleClosed
                                    ? "Disconnected"
                                    : playerCount === 2
                                        ? "Connected"
                                        : "Waiting"}
                        </span>
                    </div>

                </div>

                <div className="lobby-footer">

                    <p>
                        {battleClosed
                            ? "The battle has been closed."
                            : opponentDisconnected
                                ? "Your opponent disconnected!"
                                : battleStarted
                                    ? "Battle started! Preparing coding environment..."
                                    : battleReady
                                        ? "Both players connected! Ready to start."
                                        : "Waiting for opponent to join..."}
                    </p>

                    <button
                        onClick={handleStartBattle}
                        disabled={
                            playerCount !== 2 ||
                            !battleReady ||
                            loading ||
                            battleClosed ||
                            battleStarted
                        }
                    >
                        {loading
                            ? "Starting..."
                            : battleStarted
                                ? "Battle Started"
                                : "Start Battle"}
                    </button>

                </div>

            </main>

        </div>
    );
}

export default Lobby;
