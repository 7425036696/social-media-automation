import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../utils/logger.js';

export class TwitterPublisher {
  constructor() {
    const requiredVars = {
      API_KEY: process.env.API_KEY,
      API_KEY_SECRET: process.env.API_KEY_SECRET,
      ACCESS_TOKEN: process.env.ACCESS_TOKEN,
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.client = new TwitterApi({
      appKey: process.env.API_KEY,
      appSecret: process.env.API_KEY_SECRET,
      accessToken: process.env.ACCESS_TOKEN,
      accessSecret: process.env.ACCESS_TOKEN_SECRET,
    });
    this.twitterClient = this.client.readWrite;
  }

  // Truncate tweet to Twitter's character limit
  truncateTweet(text, maxLength = 280) {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to truncate at word boundary
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Clean and optimize tweet content
  optimizeTweet(tweetText) {
    let optimized = tweetText;
    
    // Remove duplicate hashtags
    const hashtags = [...new Set(optimized.match(/#\w+/g) || [])];
    const content = optimized.replace(/#\w+/g, '').trim();
    
    // Prioritize most important hashtags (keep only top 5)
    const priorityHashtags = hashtags.slice(0, 5);
    
    // Reconstruct tweet
    optimized = `${content} ${priorityHashtags.join(' ')}`;
    
    // Truncate if still too long
    return this.truncateTweet(optimized);
  }

  async publishTweet(tweetText) {
    try {
      // Optimize and truncate tweet
      const optimizedTweet = this.optimizeTweet(tweetText);
      
      logger.info(`Original tweet length: ${tweetText.length}`);
      logger.info(`Optimized tweet length: ${optimizedTweet.length}`);
      logger.info(`Publishing tweet: ${optimizedTweet}`);
      
      if (optimizedTweet.length > 280) {
        throw new Error(`Tweet still too long: ${optimizedTweet.length} characters`);
      }

      const response = await this.twitterClient.v2.tweet(optimizedTweet);
      
      return {
        success: true,
        message: 'Tweet published successfully',
        data: response.data,
        originalLength: tweetText.length,
        publishedLength: optimizedTweet.length
      };
    } catch (error) {
      logger.error('❌ Failed to publish tweet:', error.message);
      throw error;
    }
  }

  async testCredentials() {
    try {
      const user = await this.twitterClient.v2.me();
      logger.info('✅ Twitter credentials valid for user:', user.data.username);
      return true;
    } catch (error) {
      logger.error('❌ Twitter credential test failed:', error.message);
      return false;
    }
  }
}