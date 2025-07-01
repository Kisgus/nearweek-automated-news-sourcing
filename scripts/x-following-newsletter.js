#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');

class UserOwnedAINewsletter {
  constructor(config = {}) {
    // Initialize X API client with proper key mapping
    const apiKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY;
    const apiSecret = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_TOKEN_SECRET;
    
    // Use Bearer Token for read-only operations
    if (process.env.TWITTER_BEARER_TOKEN) {
      console.log('📡 Using Bearer Token authentication for X API');
      this.client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    } else if (apiKey && apiSecret && accessToken && accessSecret) {
      console.log('🔑 Using OAuth 1.0a authentication for X API');
      this.client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });
    } else {
      throw new Error('Twitter API credentials not properly configured. Need either Bearer Token or full OAuth credentials.');
    }
    
    this.v2Client = this.client.v2;
    this.username = 'userownedai';
    this.webhookUrl = config.webhookUrl || 'http://localhost:3000/webhook/x-api';
    this.outputDir = path.join(__dirname, '../data/newsletters');
  }

  async getFollowingList() {
    console.log('📋 Fetching @userownedai following list...');
    
    try {
      // Get user ID for @userownedai
      const user = await this.v2Client.userByUsername(this.username);
      const userId = user.data.id;
      
      // Get following list with pagination
      const following = [];
      let paginationToken;
      
      do {
        const response = await this.v2Client.following(userId, {
          max_results: 1000,
          pagination_token: paginationToken,
          'user.fields': ['name', 'username', 'description', 'public_metrics', 'verified']
        });
        
        if (response.data) {
          following.push(...response.data);
        }
        paginationToken = response.meta?.next_token;
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1000));
      } while (paginationToken);
      
      console.log(`✅ Found ${following.length} accounts that @userownedai follows`);
      
      // Save following list
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.writeFile(
        path.join(this.outputDir, 'following-list.json'),
        JSON.stringify(following, null, 2)
      );
      
      return following;
    } catch (error) {
      console.error('❌ Error fetching following list:', error.message);
      // Fallback to curated list if API fails
      return this.getCuratedList();
    }
  }

  getCuratedList() {
    console.log('📋 Using curated high-value accounts...');
    return [
      { username: 'elonmusk', name: 'Elon Musk', verified: true },
      { username: 'sama', name: 'Sam Altman', verified: true },
      { username: 'VitalikButerin', name: 'Vitalik Buterin', verified: true },
      { username: 'naval', name: 'Naval', verified: true },
      { username: 'balajis', name: 'Balaji Srinivasan', verified: true },
      { username: 'karpathy', name: 'Andrej Karpathy', verified: true },
      { username: 'AndrewYNg', name: 'Andrew Ng', verified: true }
    ];
  }

  async getRecentPostsFromFollowing(following, hoursBack = 24) {
    console.log(`\n📰 Fetching posts from last ${hoursBack} hours...`);
    
    const allPosts = [];
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < Math.min(following.length, 20); i += batchSize) {
      const batch = following.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          // Use search instead of timeline due to API limitations
          const query = `from:${user.username} -is:retweet -is:reply`;
          const tweets = await this.v2Client.search(query, {
            max_results: 10,
            'tweet.fields': ['created_at', 'public_metrics', 'context_annotations', 'entities'],
            'user.fields': ['name', 'username', 'verified']
          });
          
          if (tweets.data && tweets.data.length > 0) {
            const postsWithAuthor = tweets.data.map(tweet => ({
              ...tweet,
              author: user,
              relevance_score: this.calculateRelevance(tweet, user),
              url: `https://x.com/${user.username}/status/${tweet.id}`
            }));
            
            allPosts.push(...postsWithAuthor);
            console.log(`  ✓ ${user.username}: ${tweets.data.length} posts`);
          }
        } catch (error) {
          console.error(`  ✗ Error fetching posts from ${user.username}:`, error.message);
        }
      }));
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Sort by relevance and engagement
    allPosts.sort((a, b) => {
      const scoreA = a.relevance_score + (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0) * 2;
      const scoreB = b.relevance_score + (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0) * 2;
      return scoreB - scoreA;
    });
    
    console.log(`\n✅ Collected ${allPosts.length} total posts`);
    return allPosts;
  }

  calculateRelevance(tweet, author) {
    let score = 0;
    const text = tweet.text.toLowerCase();
    
    // AI/Crypto keywords
    const aiKeywords = ['ai', 'artificial intelligence', 'llm', 'machine learning', 'neural', 'gpt', 'claude', 'agent'];
    const cryptoKeywords = ['crypto', 'blockchain', 'defi', 'web3', 'dao', 'nft', 'token', 'protocol'];
    const nearKeywords = ['near', 'aurora', 'octopus', 'ref finance', 'burrow'];
    
    // Score based on keywords
    aiKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 15;
    });
    
    cryptoKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10;
    });
    
    nearKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 20;
    });
    
    // Boost for verified accounts
    if (author.verified) score += 10;
    
    // Boost for high-follower accounts
    if (author.public_metrics?.followers_count > 10000) score += 5;
    if (author.public_metrics?.followers_count > 100000) score += 10;
    
    return score;
  }

  async generateNewsletter(posts) {
    console.log('\n📝 Generating newsletter content...');
    
    const topPosts = posts.slice(0, 15); // Top 15 posts
    const newsletter = {
      title: `UserOwned.AI Daily Intelligence Report`,
      date: new Date().toISOString(),
      subtitle: `AI x Crypto insights from ${posts.length} posts by thought leaders`,
      sections: {
        trending: [],
        ai_focus: [],
        crypto_defi: [],
        near_ecosystem: []
      }
    };
    
    // Categorize posts
    topPosts.forEach(post => {
      const category = this.categorizePost(post);
      const formattedPost = {
        author: `@${post.author.username}`,
        author_name: post.author.name,
        text: post.text,
        engagement: (post.public_metrics?.like_count || 0) + (post.public_metrics?.retweet_count || 0),
        url: post.url,
        relevance: post.relevance_score
      };
      
      newsletter.sections[category].push(formattedPost);
    });
    
    // Generate formats
    const html = this.generateHTMLNewsletter(newsletter);
    const markdown = this.generateMarkdownNewsletter(newsletter);
    
    // Save outputs
    const timestamp = new Date().toISOString().split('T')[0];
    await fs.writeFile(
      path.join(this.outputDir, `newsletter-${timestamp}.html`),
      html
    );
    
    await fs.writeFile(
      path.join(this.outputDir, `newsletter-${timestamp}.md`),
      markdown
    );
    
    await fs.writeFile(
      path.join(this.outputDir, `newsletter-${timestamp}.json`),
      JSON.stringify(newsletter, null, 2)
    );
    
    console.log('✅ Newsletter generated successfully!');
    
    return { html, markdown, data: newsletter };
  }

  categorizePost(post) {
    const text = post.text.toLowerCase();
    
    if (text.includes('near') || text.includes('aurora')) {
      return 'near_ecosystem';
    } else if (text.includes('ai') || text.includes('llm') || text.includes('gpt')) {
      return 'ai_focus';
    } else if (text.includes('defi') || text.includes('crypto') || text.includes('token')) {
      return 'crypto_defi';
    } else {
      return 'trending';
    }
  }

  generateMarkdownNewsletter(newsletter) {
    return `# ${newsletter.title}

*${newsletter.subtitle}*

📅 ${new Date(newsletter.date).toLocaleDateString()}

---

${Object.entries(newsletter.sections).map(([section, posts]) => `
## ${section.replace(/_/g, ' ').toUpperCase()}

${posts.map(post => `
### ${post.author} (${post.author_name})
> ${post.text}

👍 ${post.engagement} engagements | 📊 Relevance: ${post.relevance}
🔗 [View on X](${post.url})

---
`).join('\n')}
`).join('\n')}

*Generated by UserOwned.AI Intelligence Network*
    `;
  }

  generateHTMLNewsletter(newsletter) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${newsletter.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00D9FF 0%, #0A0A0A 100%); color: white; padding: 40px; border-radius: 10px; }
    .section { margin: 30px 0; }
    .post { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 8px; }
    .author { font-weight: bold; color: #00D9FF; }
    .engagement { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${newsletter.title}</h1>
      <p>${newsletter.subtitle}</p>
      <p>${new Date(newsletter.date).toLocaleDateString()}</p>
    </div>
    
    ${Object.entries(newsletter.sections).map(([section, posts]) => `
      <div class="section">
        <h2>${section.replace(/_/g, ' ').toUpperCase()}</h2>
        ${posts.map(post => `
          <div class="post">
            <div class="author">${post.author} (${post.author_name})</div>
            <p>${post.text}</p>
            <div class="engagement">👍 ${post.engagement} engagements | 📊 Relevance: ${post.relevance}</div>
            <a href="${post.url}" target="_blank">View on X</a>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  async sendToTelegram(newsletter) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('⚠️ Telegram not configured, skipping...');
      return;
    }

    const message = `🚀 *UserOwned.AI Newsletter*
${newsletter.title}

📅 ${new Date(newsletter.date).toLocaleDateString()}

${Object.entries(newsletter.sections).map(([section, posts]) => 
  posts.length > 0 ? `\n*${section.toUpperCase()}*\n${posts.slice(0, 2).map(post => 
    `${post.author}: ${post.text.substring(0, 100)}...\n🔗 [View](${post.url})`
  ).join('\n\n')}` : ''
).join('\n')}

🤖 Powered by NEARWEEK AI`;

    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      console.log('✅ Sent to Telegram');
    } catch (error) {
      console.error('❌ Telegram send failed:', error.message);
    }
  }

  async run(options = {}) {
    try {
      console.log('🚀 Starting UserOwned.AI Newsletter Generator\n');
      
      // 1. Get following list
      const following = await this.getFollowingList();
      
      // 2. Get recent posts
      const posts = await this.getRecentPostsFromFollowing(
        following, 
        options.hoursBack || 24
      );
      
      // 3. Generate newsletter
      const newsletter = await this.generateNewsletter(posts);
      
      // 4. Send to Telegram if configured
      if (!options.dryRun) {
        await this.sendToTelegram(newsletter.data);
      }
      
      console.log('\n✨ Newsletter generation complete!');
      console.log(`📁 Files saved to: ${this.outputDir}`);
      
      return newsletter;
      
    } catch (error) {
      console.error('❌ Newsletter generation failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const newsletter = new UserOwnedAINewsletter({
    webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook/x-api'
  });
  
  const args = process.argv.slice(2);
  const options = {
    hoursBack: args.includes('--daily') ? 24 : 168,
    dryRun: args.includes('--dry-run')
  };
  
  newsletter.run(options).catch(console.error);
}

module.exports = UserOwnedAINewsletter;