#!/usr/bin/env node

require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
const path = require('path');

async function testBearerNewsGathering() {
  console.log('🚀 Testing News Gathering with Bearer Token Only');
  console.log('===============================================\n');
  
  if (!process.env.TWITTER_BEARER_TOKEN) {
    console.error('❌ TWITTER_BEARER_TOKEN not found!');
    return;
  }
  
  console.log(`✅ Bearer Token found: ${process.env.TWITTER_BEARER_TOKEN.length} chars\n`);
  
  try {
    // Initialize with Bearer Token only
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const v2 = client.v2;
    
    // Test 1: Get @userownedai profile
    console.log('1️⃣ Fetching @userownedai profile...');
    const userownedai = await v2.userByUsername('userownedai');
    console.log(`✅ Found: ${userownedai.data.name} (@${userownedai.data.username})`);
    console.log(`   ID: ${userownedai.data.id}\n`);
    
    // Test 2: Search for AI/Crypto tweets
    console.log('2️⃣ Searching for AI x Crypto content...');
    const searchResults = await v2.search('AI crypto blockchain', {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['name', 'username', 'verified'],
      'expansions': ['author_id']
    });
    
    if (searchResults.data && searchResults.data.length > 0) {
      console.log(`✅ Found ${searchResults.data.length} tweets!\n`);
      
      // Display results
      searchResults.data.slice(0, 3).forEach((tweet, i) => {
        const author = searchResults.includes?.users?.find(u => u.id === tweet.author_id);
        console.log(`📰 Tweet ${i + 1}:`);
        console.log(`   Author: @${author?.username || 'unknown'}`);
        console.log(`   Text: ${tweet.text.substring(0, 100)}...`);
        console.log(`   Engagement: ${tweet.public_metrics.like_count + tweet.public_metrics.retweet_count}`);
        console.log('');
      });
    }
    
    // Test 3: Get timeline from specific accounts
    console.log('3️⃣ Fetching posts from key accounts...');
    const keyAccounts = ['VitalikButerin', 'sama', 'elonmusk'];
    
    for (const username of keyAccounts) {
      try {
        const user = await v2.userByUsername(username);
        const timeline = await v2.userTimeline(user.data.id, {
          max_results: 3,
          exclude: ['retweets', 'replies'],
          'tweet.fields': ['created_at', 'public_metrics']
        });
        
        if (timeline.data && timeline.data.length > 0) {
          console.log(`✅ @${username}: ${timeline.data.length} recent tweets`);
          const latestTweet = timeline.data[0];
          console.log(`   Latest: "${latestTweet.text.substring(0, 80)}..."`);
          console.log(`   Engagement: ${latestTweet.public_metrics.like_count + latestTweet.public_metrics.retweet_count}\n`);
        }
      } catch (err) {
        console.log(`⚠️  @${username}: ${err.message}`);
      }
    }
    
    // Test 4: Generate simple newsletter
    console.log('4️⃣ Generating sample newsletter...\n');
    
    const newsletter = {
      title: 'UserOwned.AI Daily Brief',
      date: new Date().toLocaleDateString(),
      sources: searchResults.data.length,
      topTweets: searchResults.data.slice(0, 5).map(tweet => ({
        text: tweet.text,
        engagement: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count
      }))
    };
    
    // Save test output
    const outputDir = path.join(__dirname, '../data/test-newsletters');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `bearer-test-${Date.now()}.json`;
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(newsletter, null, 2)
    );
    
    console.log('✅ Sample newsletter saved to:', filename);
    console.log('\n🎉 Bearer Token news gathering is WORKING!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 429) {
      console.error('   Rate limit hit - wait 15 minutes');
    } else if (error.code === 403) {
      console.error('   Access forbidden - check API permissions');
    }
  }
}

testBearerNewsGathering();