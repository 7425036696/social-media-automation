import 'dotenv/config';
import cron from 'node-cron';
import { logger } from './src/utils/logger.js';
import { TrendingFetcher } from './src/services/trendingFetcher.js';
import { ContentGenerator } from './src/services/contentGenerator.js';
// import { TwitterPublisher } from './src/services/twitterPublisher.js';
import { HashnodePublisher } from './src/services/hashnodePublisher.js';
import { sleep } from './src/utils/helpers.js';

class AIContentAgent {
  constructor() {
    this.trendingFetcher = new TrendingFetcher();
    this.contentGenerator = new ContentGenerator();
    // this.twitterPublisher = new TwitterPublisher();
    this.hashnodePublisher = new HashnodePublisher();
  }
async runAutomation() {
  try {
    logger.info('🚀 Starting AI content automation cycle');

    // Step 1: Fetch trending AI topics
    logger.info('📡 Fetching trending AI topics...');
    const trendingTopics = await this.trendingFetcher.fetchTrends();
    
    if (!trendingTopics || trendingTopics.length === 0) {
      throw new Error('No trending topics found');
    }

    // Step 2: Generate content (tweet + blog post) from topics
    logger.info('📝 Generating content...');
    const content = await this.contentGenerator.generateContent(trendingTopics);
    if (!content || !content.tweet || !content.blogPost) {
      throw new Error('Content generation failed');
    }

    // Step 3: Publish to platforms with delays
    const results = { twitter: null, hashnode: null };

    // Publish to Twitter
    // try {
    //   logger.info('📱 Publishing to Twitter/X...');
    //   results.twitter = await this.twitterPublisher.publishTweet(content.tweet);
    //   logger.info('✅ Successfully published to Twitter');
    //   await sleep(2000); // delay before next API call
    // } catch (error) {
    //   console.log(error);
    //   logger.error('❌ Twitter publishing failed:', error.message);
    //   results.twitter = { error: error.message };
    // }

    // Publish to Hashnode
    if (process.env.HASHNODE_API_TOKEN) {
      try {
        logger.info('📝 Publishing to Hashnode...');
        results.hashnode = await this.hashnodePublisher.publishPost(content.blogPost);
        logger.info('✅ Successfully published to Hashnode');
      } catch (error) {
        console.log(error);
        logger.error('❌ Hashnode publishing failed:', error.message);
        results.hashnode = { error: error.message };
      }
    } else {
      logger.warn('⚠️ Hashnode API credentials not configured, skipping...');
    }

    logger.info('🎉 Automation cycle completed successfully');
    return results;

  } catch (error) {
    logger.error('💥 Automation cycle failed:', error.message);
    throw error;
  }
}


  startScheduler() {
    // Run every 6 hours at minute 0
    cron.schedule('0 */6 * * *', async () => {
      logger.info('⏰ Scheduled automation triggered');
      try {
        await this.runAutomation();
      } catch (error) {
        logger.error('Scheduled automation failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    logger.info('⏰ Scheduler started - will run every 6 hours');
  }
}

// Main execution
async function main() {
  try {
    const agent = new AIContentAgent();

    // Check if running as a one-time execution or scheduled
    const isOneTime = process.argv.includes('--once');
    
    if (isOneTime) {
      logger.info('🔄 Running one-time execution...');
      await agent.runAutomation();
    } else {
      logger.info('🕐 Starting scheduled automation...');
      agent.startScheduler();
      
      // Keep the process alive
      process.on('SIGINT', () => {
        logger.info('👋 Gracefully shutting down...');
        process.exit(0);
      });

      // Run once immediately, then follow schedule
      if (process.env.RUN_IMMEDIATELY === 'true') {
        logger.info('🚀 Running immediate execution...');
        setTimeout(() => agent.runAutomation(), 5000);
      }
    }
  } catch (error) {
    logger.error('💥 Application startup failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();