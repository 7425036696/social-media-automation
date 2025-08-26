import axios from 'axios';
import { logger } from '../utils/logger.js';
import { retryWrapper } from '../utils/helpers.js';
import { url } from 'inspector';
import { GoogleGenerativeAI } from "@google/generative-ai";

export class TrendingFetcher {
  constructor() {
    this.sources = [
      {
        name: 'Google News RSS',
        url : 'https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=930c29c405d34f85832b7e669f68d04c',
        parser: this.parseGoogleNews.bind(this)
      },
      {
        name: 'Hacker News',
        url: 'https://hn.algolia.com/api/v1/search?query=artificial%20intelligence%20OR%20machine%20learning%20OR%20AI&tags=story&hitsPerPage=10',
        parser: this.parseHackerNews.bind(this)
      }
    ];
  }

  async fetchTrends() {
    const allTrends = [];

    for (const source of this.sources) {
      try {
        logger.info(`📡 Fetching from ${source.name}...`);
        const trends = await retryWrapper(() => this.fetchFromSource(source), 3);
        allTrends.push(...trends);
        logger.info(`✅ Fetched ${trends.length} items from ${source.name}`);
      } catch (error) {
        logger.warn(`⚠️ Failed to fetch from ${source.name}:`, error.message);
      }
    }   
console.log(allTrends,"sab trends hai");
    // Remove duplicates and sort by relevance/recency
    const uniqueTrends = await this.scoreWithGemini(allTrends);
    uniqueTrends.sort((a, b) => {
  const scoreDiff = b.score - a.score;
  if (scoreDiff !== 0) return scoreDiff;
  return new Date(b.timestamp) - new Date(a.timestamp);
});
    logger.info(`📊 Total unique trending topics: ${uniqueTrends.length}`);
    console.log('Top Trends:', uniqueTrends.slice(0, 3).map(t => t.title));
    return uniqueTrends.slice(0, 5); // Return top 5 trends
  }

  async fetchFromSource(source) {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIContentBot/1.0)',
          'Accept': 'application/json, application/xml, text/xml'
        },
        timeout: 10000
      });

      return await source.parser(response.data);
    } catch (error) {
      logger.error(`Failed to fetch from ${source.name}:`, error.message);
      throw error;
    }
  }

async parseGoogleNews(data) {
  try {
    const items = [];
    if (data.articles && data.articles.length > 0) {
      for (const article of data.articles.slice(0, 10)) {
        if (article.title && this.isAIRelated(article.title)) {
          items.push({
            title: article.title,
            url: article.url || '',
            source: 'NewsAPI',
            timestamp: new Date(article.publishedAt || Date.now()),
            score: this.calculateRelevanceScore(article.title)
          });
        }
      }
    }
    return items;
  } catch (error) {
    logger.error('Error parsing Google News JSON:', error);
    return [];
  }
}


  
  async parseHackerNews(data) {
    try {
      const items = [];
      if (data.hits) {
        for (const hit of data.hits.slice(0, 10)) {
          if (this.isAIRelated(hit.title)) {
            items.push({
              title: hit.title,
              url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              source: 'Hacker News',
              timestamp: new Date(hit.created_at),
              score: this.calculateRelevanceScore(hit.title) + (hit.points / 10)
            });
          }
        }
      }
      return items;
    } catch (error) {
      logger.error('Error parsing Hacker News:', error);
      return [];
    }
  }
  
  async scoreWithGemini(trends) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are ranking trending AI news for importance and virality.
From the given items, select the **top 3 AI-related news** that are most likely to gain attraction on social media.  

Return the result strictly as a JSON array of exactly 3 objects, where each object has:
- "title": the original title
- "score": a number from 0–10 (10 = highly important/trending, 0 = irrelevant)

Do not include explanations, text, code fences, or extra commentary — only valid JSON.

Items:
${trends.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}
`;

    const response = await model.generateContent(prompt);
    let text = response.response.text();

    // 🔹 Strip code fences or markdown junk
    text = text.replace(/```json|```/g, '').trim();

    let scores;
    try {
      scores = JSON.parse(text);
    } catch (e) {
      logger.error("❌ JSON parse failed. Raw Gemini output:", text);
      scores = [];
    }

    // 🔹 Map Gemini scores back into trend objects
    return trends.map(trend => {
      const match = scores.find(s =>
        s.title.toLowerCase().includes(trend.title.toLowerCase().slice(0, 20))
      );
      return {
        ...trend,
        score: match ? match.score : 0
      };
    });

  } catch (error) {
    logger.error("Gemini scoring failed:", error);
    return trends; // fallback: return original trends with default scores
  }
}

  

  isAIRelated(title) {
    const aiKeywords = [
      'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
      'neural network', 'gpt', 'chatgpt', 'openai', 'gemini', 'claude', 'llm',
      'generative ai', 'genai', 'transformer', 'nlp', 'computer vision',
      'robotics', 'automation', 'algorithm', 'data science', 'tensorflow',
      'pytorch', 'hugging face', 'anthropic', 'midjourney', 'stable diffusion'
    ];

    const lowerTitle = title.toLowerCase();
    return aiKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  calculateRelevanceScore(title) {
    let score = 0;
    const highValueKeywords = ['breakthrough', 'new', 'latest', 'revolutionary', 'major', 'announces'];
    const lowerTitle = title.toLowerCase();

    highValueKeywords.forEach(keyword => {
      if (lowerTitle.includes(keyword)) score += 2;
    });

    // Boost score for trending AI companies/products
    const trendingTerms = ['openai', 'chatgpt', 'gemini', 'claude', 'midjourney', 'nvidia'];
    trendingTerms.forEach(term => {
      if (lowerTitle.includes(term)) score += 3;
    });

    return score;
  }
}