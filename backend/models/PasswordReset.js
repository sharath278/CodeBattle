
const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },

        otpHash: {
            type: String,
            required: true
        },

        otpExpiresAt: {
            type: Date,
            required: true
        },

        attempts: {
            type: Number,
            default: 0
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        resetToken: {
            type: String,
            default: null
        },

        resetTokenExpiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const PasswordReset = mongoose.model(
    "PasswordReset",
    passwordResetSchema
);

module.exports = PasswordReset;
