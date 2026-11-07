
require("dotenv").config();

const sendEmail = require("./utils/sendEmail");

const testEmail = async () => {
    try {
        await sendEmail(
            process.env.EMAIL_USER,
            "CodeBattle SMTP Test",
            `
                <h2>Welcome to CodeBattle!</h2>
                <p>Your Gmail SMTP connection is working.</p>
                <h3>Email verification setup successful!</h3>
            `
        );

        console.log("Test email sent successfully!");

    } catch (error) {
        console.error("Test failed:", error.message);
    }
};

testEmail();
