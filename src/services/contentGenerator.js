import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import { retryWrapper } from '../utils/helpers.js';

export class ContentGenerator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generateContent(trendingTopics) {
    try {
      logger.info('🧠 Starting content generation with Gemini 2.0 Flash...');

      const topTrend = trendingTopics[0];
      const contextTopics = trendingTopics.slice(0, 3).map(t => t.title).join(', ');

      // Generate tweet and blog post in parallel
      const [tweet, blogPost] = await Promise.all([
        retryWrapper(() => this.generateTweet(topTrend, contextTopics), 3),
        retryWrapper(() => this.generateBlogPost(topTrend, contextTopics), 3)
      ]);
console.log(tweet,"tweet hai ye");
      console.log(blogPost,"blogpost hai ye");
      return {
        tweet: tweet.trim(),
        blogPost: {
          title: this.extractBlogTitle(blogPost),
          content: blogPost.trim(),
          tags: this.extractTags(blogPost)
        }
      };
    } catch (error) {
      logger.error('❌ Content generation failed:', error);
      throw error;
    }
  }

  async generateTweet(mainTrend, contextTopics) {
    const prompt = `You are a viral AI content creator. Create a highly engaging Twitter/X post about this trending AI topic:

MAIN TOPIC: ${mainTrend.title}
RELATED CONTEXT: ${contextTopics}
SOURCE: ${mainTrend.source}

REQUIREMENTS:
- Should be less than  280 characters in every condition
- Make it viral and engaging (use hooks, questions, bold claims, or surprising facts)
- Include emojis (1-3 max) for visual appeal
- add only this two tag in the tweet: @Hiteshdotcom,@piyushgarg_dev
- Focus on the impact, implications, or "what this means for you"
- Use action words and create curiosity

STYLE OPTIONS (pick one that fits):
- "🚨 BREAKING:" for news
- "🤯 Mind-blown:" for surprising facts  
- "💡 Hot take:" for opinions
- "🔮 The future is here:" for innovations
- "⚡ Quick thread:" for explanations

Generate ONLY the tweet text, nothing else.`;

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  async generateBlogPost(mainTrend, contextTopics) {
    const prompt = `You are an expert AI content writer for Hashnode. Write a comprehensive, SEO-optimized blog post about this trending AI topic:

MAIN TOPIC: ${mainTrend.title}
RELATED CONTEXT: ${contextTopics}
SOURCE: ${mainTrend.source}

REQUIREMENTS:
- Length: 500-800 words
- Format: Markdown
- Include a catchy, SEO-friendly title
- Structure with clear headings (H2, H3)
- Add code snippets or examples where relevant
- Include actionable insights
- End with a strong conclusion and call-to-action
- SEO keywords: artificial intelligence, machine learning, AI trends, technology

STRUCTURE:
# [Catchy Title with Keywords]

## Introduction
Hook the reader with an interesting opening

## Main Content Sections (2-3 sections with H2/H3 headings)
- What's happening/what's new
- Why it matters
- Technical details (if applicable)
- Real-world implications
- Examples or code snippets

## Key Takeaways
Bullet points of main insights

## Conclusion
Summary and future outlook

TAGS: ai, machine-learning, artificial-intelligence, technology, innovation, future-tech

the tags should be relevant to the content and popular on Hashnode.
these are sometags that you have to add in the blog post: '@hiteshchoudharylco

#HiteshChaudhary
ChaiCode
Chaiaurcode
generative ai
GenAI Cohort
#piyushgarag
#OpenAI #NextJS #AI #React #WebDevelopment #Hashnode #SideProject #chaicode #piyushgarg '


Write in a conversational yet authoritative tone. Make it shareable and engaging for developers and tech enthusiasts.`;

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  extractBlogTitle(blogContent) {
    const titleMatch = blogContent.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'AI Trends: Latest Developments in Artificial Intelligence';
  }

  extractTags(blogContent) {
    const tagsMatch = blogContent.match(/TAGS?:\s*(.+)$/mi);
    if (tagsMatch) {
      return tagsMatch[1].split(',').map(tag => tag.trim().toLowerCase());
    }
    
    // Default tags if not found in content
  }

  // Utility method for testing content generation
  async testGeneration() {
    const mockTrends = [
      {
        title: 'OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities',
        source: 'Tech News',
        timestamp: new Date()
      },
      {
        title: 'Google Gemini 2.0 Beats Human Performance in Complex Problem Solving',
        source: 'AI Research',
        timestamp: new Date()
      }
    ];

    return await this.generateContent(mockTrends);
  }
}