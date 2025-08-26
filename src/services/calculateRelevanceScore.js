import {dotenv} from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function scoreWithGemini(trends) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Ask Gemini to assign relevance scores
    const prompt = `
      You are ranking trending AI news for importance.
      For each item, return a JSON array where each element has:
      - "title": the original title
      - "score": number 0–10 (10 = highly important/trending, 0 = irrelevant)

      Items:
      ${trends.map((t, i) => `${i+1}. ${t.title}`).join("\n")}
    `;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    // Try parsing JSON safely
    const scores = JSON.parse(text);

    // Map Gemini scores back into trend objects
    return trends.map(trend => {
      const match = scores.find(s => s.title.toLowerCase().includes(trend.title.toLowerCase().slice(0, 15)));
      return {
        ...trend,
        score: match ? match.score : 0
      };
    });

  } catch (error) {
    logger.error("Gemini scoring failed:", error);
    return trends; // fallback: return unscored
  }
}
