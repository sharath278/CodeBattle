
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const resetToken = location.state?.resetToken;

    const [form, setForm] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!resetToken) {
            setError("Reset session expired. Please request a new OTP.");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/reset-password",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        resetToken,
                        newPassword: form.newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password reset failed");
            }

            navigate("/login", {
                state: { message: "Password reset successfully. Sign in now." }
            });
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
                    <h1>Set new password</h1>
                    <p>Choose a strong password for your account.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label>New password</label>
                    <input
                        type="password"
                        name="newPassword"
                        placeholder="Enter new password"
                        value={form.newPassword}
                        onChange={handleChange}
                        minLength="8"
                        required
                    />

                    <label>Confirm password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        minLength="8"
                        required
                    />

                    <button className="auth-button" disabled={loading}>
                        {loading ? "Updating..." : "Reset password"}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/login">Back to login</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
