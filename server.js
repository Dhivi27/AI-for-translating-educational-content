import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static(".")); // serve index.html

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/translate", async (req, res) => {
    const { text, target_language } = req.body;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful educational translator." },
                { role: "user", content: `Translate this into ${target_language}: ${text}` }
            ]
        });

        res.json({ translation: response.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
