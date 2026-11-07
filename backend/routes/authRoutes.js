
const express = require("express");

const router = express.Router();

const {
    signup,
    verifySignupOTP,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
} = require("../controllers/authController");


router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);
const protect = require("../middleware/authMiddleware");

router.get("/protected", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "You accessed a protected route!",
        userId: req.user.userId
    });
});

module.exports = router;
