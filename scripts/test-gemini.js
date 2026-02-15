const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        const modelName = "gemini-2.5-flash"; // Found in curl output
        console.log(`Trying '${modelName}'...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Status report.");
        console.log("✅ SUCCESS:", result.response.text());
    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

run();
