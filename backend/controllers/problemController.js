
const Problem = require("../models/Problem");

// GET /api/problems/:slug
const getProblemBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const problem = await Problem.findOne({ slug })
            .select("-hiddenTestCases -__v");

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found!"
            });
        }

        return res.status(200).json({
            success: true,
            problem
        });

    } catch (error) {
        console.error("Get problem error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch problem."
        });
    }
};

module.exports = {
    getProblemBySlug
};
