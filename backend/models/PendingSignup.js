
const mongoose = require("mongoose");

const pendingSignupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },

        password: {
            type: String,
            required: true
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
        }
    },
    {
        timestamps: true
    }
);

const PendingSignup = mongoose.model(
    "PendingSignup",
    pendingSignupSchema
);

module.exports = PendingSignup;
