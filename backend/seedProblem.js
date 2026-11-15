
require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("./config/db");
const Problem = require("./models/Problem");

const seedProblems = async () => {
    try {
        await connectDB();

        const twoSum = {
            title: "Two Sum",

            slug: "two-sum",

            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",

            difficulty: "Easy",

            tags: ["Array", "Hash Table"],

            examples: [
                {
                    input: "nums = [2,7,11,15], target = 9",
                    output: "[0,1]",
                    explanation: "nums[0] + nums[1] = 2 + 7 = 9."
                },
                {
                    input: "nums = [3,2,4], target = 6",
                    output: "[1,2]",
                    explanation: "nums[1] + nums[2] = 2 + 4 = 6."
                },
                {
                    input: "nums = [3,3], target = 6",
                    output: "[0,1]",
                    explanation: "Both elements are 3, and their sum is 6."
                }
            ],

            constraints: [
                "2 <= nums.length <= 10^4",
                "-10^9 <= nums[i] <= 10^9",
                "-10^9 <= target <= 10^9",
                "Only one valid answer exists."
            ],

            starterCode: {
                cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

        // Write your solution here

        return {};
    }
};`,

                java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {

        // Write your solution here

        return new int[]{};
    }
}`,

                python: `class Solution:
    def twoSum(self, nums, target):

        # Write your solution here

        return []`,

                javascript: `var twoSum = function(nums, target) {

    // Write your solution here

    return [];
};`
            },

            hiddenTestCases: [
                {
                    input: "nums = [2,7,11,15], target = 9",
                    expectedOutput: "[0,1]"
                },
                {
                    input: "nums = [3,2,4], target = 6",
                    expectedOutput: "[1,2]"
                },
                {
                    input: "nums = [3,3], target = 6",
                    expectedOutput: "[0,1]"
                },
                {
                    input: "nums = [1,5,3,7], target = 8",
                    expectedOutput: "[0,3]"
                }
            ]
        };

        const problem = await Problem.findOneAndUpdate(
            { slug: "two-sum" },
            { $set: twoSum },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        console.log("Problem seeded successfully:", problem.title);

    } catch (error) {
        console.error("Problem seeding failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

seedProblems();
