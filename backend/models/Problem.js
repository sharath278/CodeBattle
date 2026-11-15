
const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
    {
        // Problem title
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Unique identifier used in API URLs
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Complete problem description
        description: {
            type: String,
            required: true
        },

        // Problem difficulty
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },

        // Problem topics
        tags: [{
            type: String
        }],

        // Sample examples
        examples: [{
            input: {
                type: String,
                required: true
            },

            output: {
                type: String,
                required: true
            },

            explanation: {
                type: String,
                default: ""
            }
        }],

        // Problem constraints
        constraints: [{
            type: String
        }],

        // Starter code for different languages
        starterCode: {
            type: Map,
            of: String,
            default: {}
        },

        // Hidden test cases used for judging
        hiddenTestCases: [{
            input: {
                type: String,
                required: true
            },

            expectedOutput: {
                type: String,
                required: true
            }
        }]
    },
    {
        timestamps: true
    }
);

// Create Mongoose model
const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;
