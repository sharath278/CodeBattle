
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getProblemBySlug
} = require("../controllers/problemController");

// Get a problem by its slug
router.get("/:slug", protect, getProblemBySlug);

module.exports = router;
