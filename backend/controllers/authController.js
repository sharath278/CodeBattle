
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const PendingSignup = require("../models/PendingSignup");
const PasswordReset = require("../models/PasswordReset");
const sendEmail = require("../utils/sendEmail");

// SIGNUP
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email and password"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Generate six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Hash OTP
        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // OTP expires after five minutes
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save temporary signup
        await PendingSignup.findOneAndUpdate(
            { email: normalizedEmail },
            {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                otpHash,
                otpExpiresAt,
                attempts: 0
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        // Send OTP email
        await sendEmail(
            normalizedEmail,
            "CodeBattle - Email Verification",
            `
                <div style="font-family: Arial; padding: 20px;">
                    <h2>Welcome to CodeBattle!</h2>

                    <p>Hello ${name.trim()},</p>

                    <p>Your email verification OTP is:</p>

                    <h1 style="letter-spacing: 8px; color: #7048e8;">
                        ${otp}
                    </h1>

                    <p>This OTP expires in 5 minutes.</p>

                    <p>If you did not request this, ignore this email.</p>
                </div>
            `
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully. Please verify your email."
        });

    } catch (error) {
        console.error("Signup error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process signup"
        });
    }
};


// VERIFY SIGNUP OTP
const verifySignupOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find pending signup
        const pendingUser = await PendingSignup.findOne({
            email: normalizedEmail
        });

        if (!pendingUser) {
            return res.status(404).json({
                success: false,
                message: "Signup request not found or expired"
            });
        }

        // Check expiration
        if (pendingUser.otpExpiresAt <= new Date()) {
            await PendingSignup.deleteOne({
                _id: pendingUser._id
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please signup again."
            });
        }

        // Limit incorrect attempts
        if (pendingUser.attempts >= 5) {
            await PendingSignup.deleteOne({
                _id: pendingUser._id
            });

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please signup again."
            });
        }

        // Hash entered OTP
        const enteredOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Compare OTP
        if (enteredOtpHash !== pendingUser.otpHash) {
            pendingUser.attempts += 1;
            await pendingUser.save();

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP"
            });
        }

        // Check whether user already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            await PendingSignup.deleteOne({
                _id: pendingUser._id
            });

            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Create verified user
        const newUser = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            isEmailVerified: true
        });

        // Delete temporary signup
        await PendingSignup.deleteOne({
            _id: pendingUser._id
        });

        return res.status(201).json({
            success: true,
            message: "Email verified and account created successfully!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP"
        });
    }
};




// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find user in MongoDB
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Check email verification
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first"
            });
        }

        // 4. Compare entered password with stored hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 5. Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // 6. Send successful response
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};




const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find registered user
        const user = await User.findOne({
            email: normalizedEmail
        });

        // Use the same response whether email exists or not
        const successMessage =
            "If this email is registered, a password reset OTP has been sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message: successMessage
            });
        }

        // 3. Generate six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // 4. Hash OTP
        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // 5. Set OTP expiry (5 minutes)
        const otpExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // 6. Save or update PasswordReset document
        await PasswordReset.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                otpHash,
                otpExpiresAt,
                attempts: 0,
                isVerified: false,
                resetToken: null,
                resetTokenExpiresAt: null
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        // 7. Send OTP email
        await sendEmail(
            normalizedEmail,
            "CodeBattle Password Reset",
            `
                <h2>Password Reset Request</h2>
                <p>Your CodeBattle password reset OTP is:</p>
                <h1>${otp}</h1>
                <p>This OTP expires in 5 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        );

        // 8. Send response
        return res.status(200).json({
            success: true,
            message: successMessage
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
};



const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find password reset document
        const resetData = await PasswordReset.findOne({
            email: normalizedEmail
        });

        if (!resetData) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // 3. Check OTP expiry
        if (resetData.otpExpiresAt < new Date()) {
            await PasswordReset.deleteOne({
                email: normalizedEmail
            });

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new one."
            });
        }

        // 4. Check maximum attempts
        if (resetData.attempts >= 5) {
            await PasswordReset.deleteOne({
                email: normalizedEmail
            });

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        // 5. Hash entered OTP
        const enteredOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // 6. Compare OTP hashes
        if (enteredOtpHash !== resetData.otpHash) {
            resetData.attempts += 1;
            await resetData.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // 7. Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // 8. Set reset token expiry (10 minutes)
        const resetTokenExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // 9. Update password reset document
        resetData.isVerified = true;
        resetData.resetToken = resetTokenHash;
        resetData.resetTokenExpiresAt = resetTokenExpiresAt;

        await resetData.save();

        // 10. Return reset token
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // 1. Validate input
        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        // 2. Hash the received reset token
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // 3. Find matching reset document
        const resetData = await PasswordReset.findOne({
            resetToken: resetTokenHash,
            isVerified: true
        });

        if (!resetData) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            });
        }

        // 4. Check reset token expiry
        if (resetData.resetTokenExpiresAt < new Date()) {
            await PasswordReset.deleteOne({
                _id: resetData._id
            });

            return res.status(400).json({
                success: false,
                message: "Reset token expired"
            });
        }

        // 5. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // 6. Update user password
        const user = await User.findOneAndUpdate(
            { email: resetData.email },
            { password: hashedPassword },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 7. Delete password reset document
        await PasswordReset.deleteOne({
            _id: resetData._id
        });

        // 8. Send success response
        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login."
        });

    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};






module.exports = {
    signup,
    verifySignupOTP,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
};
