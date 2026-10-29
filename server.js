require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/generate", async (req, res) => {
    try {
        const { topic, audience, tone, length } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                error: "Please enter a newsletter topic."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API key is missing from your .env file."
            });
        }

        const prompt = `
Create a complete, original newsletter using AI.

Topic: ${topic}
Target audience: ${audience || "General readers"}
Tone: ${tone || "Friendly"}
Length: ${length || "Medium"}

Requirements:
- Write an engaging title.
- Start with an interesting introduction.
- Include useful, relevant information about the topic.
- Use clear headings and short paragraphs.
- Include practical tips or key takeaways.
- End with a strong conclusion.
- Generate the actual newsletter content, not instructions or a template.
- Do not leave placeholders.
- Return plain text with readable headings.
`;

        const models = [
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite"
        ];

        let data;
        let response;

        for (const model of models) {
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": process.env.GEMINI_API_KEY
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 3000
                        }
                    })
                }
            );

            data = await response.json();

            if (response.ok) {
                break;
            }

            // Try the second model if the first is temporarily unavailable.
            if (![429, 500, 503].includes(response.status)) {
                break;
            }
        }

        if (!response.ok) {
            console.error("Gemini API error:", data);

            return res.status(response.status).json({
                error:
                    data.error?.message ||
                    "AI service is unavailable. Please try again shortly."
            });
        }

        const newsletter =
            data.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("\n")
                .trim();

        if (!newsletter) {
            return res.status(502).json({
                error: "The AI returned no newsletter. Please try again."
            });
        }

        return res.json({ newsletter });

    } catch (error) {
        console.error("Server error:", error);

        return res.status(500).json({
            error: "Could not generate the newsletter. Check your internet connection and try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Newsletter Creator running at http://localhost:${PORT}`);
});