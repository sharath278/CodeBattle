
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function VerifyOTP() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const flow = location.state?.flow;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !flow) {
            setError("Verification session not found. Please start again.");
            return;
        }

        setLoading(true);

        try {
            const endpoint =
                flow === "signup"
                    ? "verify-signup-otp"
                    : "verify-reset-otp";

            const response = await fetch(
                `http://localhost:5000/api/auth/${endpoint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "OTP verification failed");
            }

            if (flow === "signup") {
                navigate("/login", {
                    state: { message: "Email verified! You can now sign in." }
                });
            } else {
                navigate("/reset-password", {
                    state: { resetToken: data.resetToken }
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="brand-icon">CB</div>
                    <span>CodeBattle</span>
                </div>

                <div className="auth-heading">
                    <h1>Verify your email</h1>
                    <p>
                        Enter the 6-digit OTP sent to{" "}
                        <strong>{email || "your email"}</strong>.
                    </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label>One-time password</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        required
                    />

                    <button
                        className="auth-button"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to={flow === "reset" ? "/forgot-password" : "/signup"}>
                        Go back
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default VerifyOTP;
