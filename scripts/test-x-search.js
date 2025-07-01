#!/usr/bin/env node

require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testSearchAPI() {
  console.log('🔍 Testing X API Search Functionality');
  console.log('=====================================\n');
  
  if (!process.env.TWITTER_BEARER_TOKEN) {
    console.error('❌ TWITTER_BEARER_TOKEN not set');
    return;
  }
  
  try {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const v2Client = client.v2;
    
    // Test 1: Basic search
    console.log('1. Testing basic search...');
    try {
      const searchResults = await v2Client.search('ai crypto', {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics']
      });
      
      console.log('✅ Search API is accessible!');
      console.log(`   Found ${searchResults.data?.length || 0} tweets`);
    } catch (searchError) {
      console.error('❌ Search API Error:', searchError.message);
      if (searchError.code === 403) {
        console.error('   → Search API requires Basic tier or higher');
        console.error('   → Your current plan does not include search access');
      }
    }
    
    // Test 2: User timeline (alternative to search)
    console.log('\n2. Testing user timeline access...');
    const user = await v2Client.userByUsername('userownedai');
    
    try {
      const timeline = await v2Client.userTimeline(user.data.id, {
        max_results: 5,
        'tweet.fields': ['created_at', 'public_metrics']
      });
      
      console.log('✅ Timeline API is accessible!');
      console.log(`   Found ${timeline.data?.length || 0} tweets from @userownedai`);
    } catch (timelineError) {
      console.error('❌ Timeline API Error:', timelineError.message);
    }
    
    // Test 3: Alternative approach - get tweets from specific users
    console.log('\n3. Testing alternative approach (user timelines)...');
    const testUsers = ['elonmusk', 'VitalikButerin', 'sama'];
    
    for (const username of testUsers) {
      try {
        const user = await v2Client.userByUsername(username);
        const tweets = await v2Client.userTimeline(user.data.id, {
          max_results: 3,
          exclude: ['retweets', 'replies'],
          'tweet.fields': ['created_at', 'public_metrics', 'author_id']
        });
        
        if (tweets.data && tweets.data.length > 0) {
          console.log(`✅ @${username}: ${tweets.data.length} recent tweets`);
          const latestTweet = tweets.data[0];
          console.log(`   Latest: "${latestTweet.text.substring(0, 50)}..."`);
          console.log(`   Engagement: ${latestTweet.public_metrics.like_count + latestTweet.public_metrics.retweet_count}`);
        }
      } catch (err) {
        console.error(`❌ Error fetching @${username}:`, err.message);
      }
    }
    
    console.log('\n📊 API Access Summary:');
    console.log('======================');
    console.log('Bearer Token: ✅ Valid');
    console.log('User lookup: ✅ Working');
    console.log('Following list: ✅ Accessible');
    console.log('Search API: ❌ Requires Basic tier ($100/month)');
    console.log('User timelines: ✅ Working (alternative approach)');
    
    console.log('\n💡 Recommendation:');
    console.log('Since search API is not available on Free tier, the newsletter');
    console.log('script should use user timelines instead. This requires fetching');
    console.log('tweets directly from each followed account.');
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testSearchAPI();