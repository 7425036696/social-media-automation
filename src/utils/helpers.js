import { logger } from './logger.js';

/**
 * Sleep for a specified number of milliseconds
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
export const retryWrapper = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        logger.error(`❌ All ${maxRetries} retry attempts failed:`, error.message);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Validate environment variables
 */
export const validateEnvVars = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Safe JSON parse with fallback
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.warn('Failed to parse JSON:', str);
    return fallback;
  }
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Clean and normalize text for processing
 */
export const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
};

/**
 * Generate a random delay between min and max milliseconds
 */
export const randomDelay = (min = 1000, max = 5000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(delay);
};

/**
 * Rate limiter helper
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      logger.info(`⏳ Rate limit reached, waiting ${waitTime}ms...`);
      await sleep(waitTime);
    }
    
    this.requests.push(now);
  }
}

/**
 * Format timestamp for logging
 */
export const formatTimestamp = (date = new Date()) => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Check if running in production environment
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Get environment-specific configuration
 */
export const getConfig = () => {
  return {
    isProduction: isProduction(),
    logLevel: process.env.LOG_LEVEL || (isProduction() ? 'info' : 'debug'),
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
};

/**
 * Hash string for simple deduplication
 */
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Check if a string contains any of the specified keywords
 */
export const containsKeywords = (text, keywords) => {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
};