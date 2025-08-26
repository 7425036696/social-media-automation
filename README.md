# 🤖 AI Content Automation Agent

A powerful Node.js automation agent that fetches trending AI topics, generates engaging content using Gemini 2.0 Flash, and automatically publishes to Twitter/X and Hashnode.

## 🚀 Features

- **Trend Detection**: Fetches trending AI topics from Google News, Reddit, and Hacker News
- **AI Content Generation**: Uses Gemini 2.0 Flash for viral tweets and SEO-optimized blog posts
- **Multi-Platform Publishing**: Automatically posts to Twitter/X and Hashnode
- **Robust Error Handling**: Retry logic, rate limiting, and comprehensive logging
- **Flexible Deployment**: Works on Vercel, Render, Railway, or GitHub Actions
- **Extensible Architecture**: Easy to add new platforms (LinkedIn, Medium, etc.)

## 📋 Prerequisites

- Node.js 18+ 
- API keys for the services you want to use (see setup section)

## 🛠️ Installation

1. **Clone or create the project:**
```bash
mkdir ai-content-agent
cd ai-content-agent
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Configure your API keys** (see configuration section below)

## ⚙️ Configuration

### Required API Keys

#### 1. Gemini AI (Required)
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Add to `.env`: `GEMINI_API_KEY=your_key_here`

#### 2. Twitter/X API (Optional)
- Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Create a new app with Read and Write permissions
- Generate API keys and access tokens
- Add to `.env`:
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

#### 3. Hashnode API (Optional)
- Go to [Hashnode Settings > Developer](https://hashnode.com/settings/developer)
- Generate a new API token
- Add to `.env`: `HASHNODE_API_TOKEN=your_token_here`

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Twitter (Optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Hashnode (Optional)
HASHNODE_API_TOKEN=your_hashnode_token
HASHNODE_AUTO_PUBLISH=true

# App Configuration
NODE_ENV=production
LOG_LEVEL=info
RUN_IMMEDIATELY=true
PORT=3000
```

## 🚀 Usage

### Development
```bash
# Run once
npm run start -- --once

# Run with file watching
npm run dev

# Start scheduler (runs every 6 hours)
npm start
```

### Testing Individual Services
```bash
# Test content generation
node -e "
import { ContentGenerator } from './src/services/contentGenerator.js';
const generator = new ContentGenerator();
const result = await generator.testGeneration();
console.log(result);
"

# Test Twitter posting
node -e "
import { TwitterPublisher } from './src/services/twitterPublisher.js';
const publisher = new TwitterPublisher();
await publisher.testTweet();
"
```

## 🌐 Deployment Options

### 1. Vercel (Recommended for Serverless)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Set environment variables in Vercel dashboard**

### 2. Render (Recommended for Always-On Service)

1. **Connect your GitHub repository to Render**

2. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: ai-content-agent
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
      - key: TWITTER_API_KEY
        sync: false
      # Add other env vars...
```

3. **Deploy and add environment variables in Render dashboard**

### 3. Railway

1. **Connect GitHub repository**
2. **Add environment variables in Railway dashboard**
3. **Railway will auto-deploy on push**

### 4. GitHub Actions (Scheduled)

Create `.github/workflows/content-automation.yml`:
```yaml
name: AI Content Automation

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  run-automation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run automation
      run: npm run start -- --once
      env:
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
        TWITTER_API_SECRET: ${{ secrets.TWITTER_API_SECRET }}
        TWITTER_ACCESS_TOKEN: ${{ secrets.TWITTER_ACCESS_TOKEN }}
        TWITTER_ACCESS_TOKEN_SECRET: ${{ secrets.TWITTER_ACCESS_TOKEN_SECRET }}
        HASHNODE_API_TOKEN: ${{ secrets.HASHNODE_API_TOKEN }}
        NODE_ENV: production
```

## 📁 Project Structure

```
ai-content-agent/
├── src/
│   ├── index.js                 # Main application
│   ├── services/
│   │   ├── trendingFetcher.js   # Fetch trending topics
│   │   ├── contentGenerator.js  # Generate content with Gemini
│   │   ├── twitterPublisher.js  # Publish to Twitter
│   │   └── hashnodePublisher.js # Publish to Hashnode
│   └── utils/
│       ├── logger.js            # Logging utility
│       └── helpers.js           # Helper functions
├── logs/                        # Log files (production)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Customization

### Adding New Platforms

1. **Create a new publisher service:**
```javascript
// src/services/linkedinPublisher.js
export class LinkedInPublisher {
  async publishPost(content) {
    // Implementation
  }
}
```

2. **Add to main automation:**
```javascript
// src/index.js
import { LinkedInPublisher } from './services/linkedinPublisher.js';

class AIContentAgent {
  constructor() {
    // Add new publisher
    this.linkedinPublisher = new LinkedInPublisher();
  }
}
```

### Custom Content Templates

Modify `src/services/contentGenerator.js` to customize:
- Tweet templates and hashtags
- Blog post structure and SEO keywords
- Content tone and style

### Scheduling Options

Change the cron schedule in `src/index.js`:
```javascript
// Every 3 hours
cron.schedule('0 */3 * * *', ...)

// Twice daily at 9 AM and 6 PM
cron.schedule('0 9,18 * * *', ...)

// Weekdays only
cron.schedule('0 */6 * * 1-5', ...)
```

## 📊 Monitoring & Logs

### Log Levels
- `error`: Critical errors only
- `warn`: Warnings and errors
- `info`: General information (recommended)
- `debug`: Detailed debugging info

### Production Logs
Logs are saved to `logs/` directory in production:
- `error.log`: Error logs only
- `combined.log`: All logs

### Health Check
The app exposes a health check endpoint on `/health` for monitoring services.

## 🛡️ Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Use environment-specific configs** - Different keys for dev/prod
3. **Enable rate limiting** - Respect API limits
4. **Monitor logs** - Watch for suspicious activity
5. **Regular key rotation** - Update API keys periodically

## 🐛 Troubleshooting

### Common Issues

**Gemini API Errors:**
- Check API key validity
- Ensure you have credits/quota available
- Verify model name is correct (`gemini-2.0-flash-exp`)

**Twitter API Issues:**
- Verify app permissions (Read and Write)
- Check rate limits
- Ensure access tokens are not expired

**Hashnode Publishing Fails:**
- Verify API token is valid
- Check if you have a publication set up
- Ensure content meets Hashnode's requirements

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🚨 Rate Limits & Best Practices

- **Twitter**: 300 tweets per 3-hour window
- **Gemini**: 1500 requests per day (free tier)
- **Hashnode**: No official limits, but be reasonable

The agent includes built-in rate limiting and retry logic to stay within these limits.

## 🎯 Future Enhancements

- [ ] LinkedIn publishing
- [ ] Medium integration
- [ ] Image generation for posts
- [ ] Analytics and performance tracking
- [ ] Custom RSS feed sources
- [ ] Content scheduling and queuing
- [ ] A/B testing for different content styles

---

🚀 **Ready to automate your AI content?** Set up your API keys and let the agent do the work!#   s o c i a l - m e d i a - a u t o m a t i o n  
 