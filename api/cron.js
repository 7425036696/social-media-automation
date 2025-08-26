import 'dotenv/config';
import { TrendingFetcher } from '../src/services/trendingFetcher.js';
import { ContentGenerator } from '../src/services/contentGenerator.js';
import { TwitterPublisher } from '../src/services/twitterPublisher.js';
import { HashnodePublisher } from '../src/services/hashnodePublisher.js';
import { logger } from '../src/utils/logger.js';
import { validateEnvVars } from '../src/utils/helpers.js';

class AIContentAgent {
  constructor() {
    this.trendingFetcher = new TrendingFetcher();
    this.contentGenerator = new ContentGenerator();
    this.twitterPublisher = new TwitterPublisher();
    this.hashnodePublisher = new HashnodePublisher();
  }

  async runAutomation() {
    try {
      logger.info('🚀 Starting AI content automation cycle (Vercel Cron)');

      // Ensure required env vars exist
      validateEnvVars(['GEMINI_API_KEY']);

      // Step 1: Fetch trending AI topics
      const trendingTopics = await this.trendingFetcher.fetchTrends();
      if (!trendingTopics || trendingTopics.length === 0) {
        throw new Error('No trending topics found');
      }

      // Step 2: Generate AI content
      const content = await this.contentGenerator.generateContent(trendingTopics);

      // Step 3: Publish to platforms
      const results = { twitter: null, hashnode: null };

      // --- Publish to Twitter ---
      if (process.env.TWITTER_API_KEY) {
        try {
          results.twitter = await this.twitterPublisher.publishTweet(content.tweet);
          logger.info('✅ Successfully published tweet:', results.twitter.url);
        } catch (err) {
          logger.error('❌ Failed to publish tweet:', err.message);
        }
      } else {
        logger.warn('⚠️ Twitter credentials not configured, skipping tweet publishing');
      }

      // --- Publish to Hashnode ---
      if (process.env.HASHNODE_API_TOKEN) {
        try {
          results.hashnode = await this.hashnodePublisher.publishPost(content.blogPost);
          logger.info('✅ Successfully published blog post:', results.hashnode.url);
        } catch (err) {
          logger.error('❌ Failed to publish blog post:', err.message);
        }
      } else {
        logger.warn('⚠️ Hashnode credentials not configured, skipping blog publishing');
      }

      logger.info('🎉 Automation cycle completed', results);
      return results;
    } catch (error) {
      logger.error('🚨 Automation cycle failed:', error);
      throw error;
    }
  }
}

// Run immediately if invoked directly (for local testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new AIContentAgent();
  agent.runAutomation()
    .then(() => {
      logger.info('✅ Finished execution');
      process.exit(0);
    })
    .catch(err => {
      logger.error('❌ Execution failed:', err);
      process.exit(1);
    });
}

export { AIContentAgent };
