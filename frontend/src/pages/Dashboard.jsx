
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "../styles/Dashboard.css";

function Dashboard() {
    const [roomCode, setRoomCode] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const navigate = useNavigate();

    // Create Battle
    const createBattle = () => {
        socket.connect();

        socket.emit("create-battle", (response) => {
            if (response.success) {
                setRoomCode(response.roomId);
                setShowCreateModal(true);
            } else {
                alert(response.message);
            }
        });
    };

    // Join Battle
    const joinBattle = () => {
        if (!roomCode.trim()) {
            alert("Please enter a battle code");
            return;
        }

        socket.connect();

        socket.emit("join-battle", roomCode.trim(), (response) => {
            if (response.success) {
                navigate(`/lobby/${response.roomId}`, {
                    state: {
                        playerCount: response.playerCount
                    }
                });
            } else {
                alert(response.message);
            }
        });
    };

    // Enter Lobby as creator
    const enterLobby = () => {
        setShowCreateModal(false);

        navigate(`/lobby/${roomCode}`, {
            state: {
                playerCount: 1
            }
        });
    };

    // Copy room code
    const copyBattleCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            alert("Battle code copied!");
        } catch (error) {
            alert("Unable to copy battle code.");
        }
    };

    return (
        <div className="dashboard">

            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span className="logo-icon">&lt;/&gt;</span>
                    CodeBattle
                </div>

                <div className="nav-links">
                    <a href="#dashboard">Dashboard</a>
                    <a href="#battles">My Battles</a>
                    <a href="#leaderboard">Leaderboard</a>
                </div>

                <div className="profile">
                    <div className="avatar">S</div>
                    <span>Developer</span>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">

                {/* Welcome Section */}
                <section className="welcome-section">
                    <div>
                        <p className="welcome-label">YOUR CODING ARENA</p>

                        <h1>Welcome back, Developer! 👋</h1>

                        <p className="welcome-description">
                            Challenge your friends. Solve problems.
                            Prove your coding skills.
                        </p>
                    </div>

                    <div className="rank-card">
                        <span>Your Rank</span>
                        <h2>#128</h2>
                        <p>Keep climbing!</p>
                    </div>
                </section>

                {/* Battle Actions */}
                <section className="battle-actions">

                    {/* Create Battle */}
                    <div className="action-card create-card">
                        <div className="action-icon">⚔️</div>

                        <h2>Create a Battle</h2>

                        <p>
                            Challenge another developer to a
                            real-time coding duel.
                        </p>

                        <button
                            className="primary-btn"
                            onClick={createBattle}
                        >
                            Create Battle <span>→</span>
                        </button>
                    </div>

                    {/* Join Battle */}
                    <div className="action-card join-card">
                        <div className="action-icon">🎮</div>

                        <h2>Join a Battle</h2>

                        <p>
                            Have an invite code? Enter it and
                            enter the arena.
                        </p>

                        <div className="join-input">
                            <input
                                type="text"
                                placeholder="Enter battle code"
                                value={roomCode}
                                onChange={(e) =>
                                    setRoomCode(e.target.value.toUpperCase())
                                }
                            />

                            <button onClick={joinBattle}>
                                Join
                            </button>
                        </div>
                    </div>

                </section>

                {/* Statistics */}
                <section className="stats-section">

                    <div className="stat-card">
                        <span>Total Battles</span>
                        <h2>24</h2>
                        <p>All-time matches</p>
                    </div>

                    <div className="stat-card">
                        <span>Wins</span>
                        <h2>16</h2>
                        <p>Successful battles</p>
                    </div>

                    <div className="stat-card">
                        <span>Win Rate</span>
                        <h2>66.7%</h2>
                        <p>Your performance</p>
                    </div>

                    <div className="stat-card">
                        <span>Problems Solved</span>
                        <h2>42</h2>
                        <p>Across all battles</p>
                    </div>

                </section>

                {/* Recent Battles */}
                <section className="bottom-section" id="battles">

                    <div className="section-heading">
                        <h2>Recent Battles</h2>
                        <a href="#battles">View all →</a>
                    </div>

                    <div className="empty-state">
                        <div>⚔️</div>
                        <h3>No battles yet</h3>
                        <p>Your battle history will appear here.</p>
                    </div>

                </section>

            </main>

            {/* Create Battle Modal */}
            {showCreateModal && (
                <div className="modal-overlay">

                    <div className="modal">

                        <button
                            className="close-btn"
                            onClick={() => setShowCreateModal(false)}
                        >
                            ×
                        </button>

                        <div className="action-icon">⚔️</div>

                        <h2>Battle Created!</h2>

                        <p>
                            Share this code with your opponent.
                        </p>

                        <div className="battle-code">
                            {roomCode}
                        </div>

                        <button
                            className="primary-btn"
                            onClick={copyBattleCode}
                        >
                            Copy Battle Code
                        </button>

                        <button
                            className="primary-btn"
                            onClick={enterLobby}
                        >
                            Enter Lobby
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Dashboard;
