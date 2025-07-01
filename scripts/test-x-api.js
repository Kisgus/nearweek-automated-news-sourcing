#!/usr/bin/env node

// Test X API Integration
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

console.log('🔍 X API Integration Test');
console.log('=========================\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('-------------------------------');
const configs = {
  'TWITTER_API_KEY': process.env.TWITTER_API_KEY,
  'TWITTER_API_SECRET': process.env.TWITTER_API_SECRET,
  'TWITTER_BEARER_TOKEN': process.env.TWITTER_BEARER_TOKEN,
  'TWITTER_ACCESS_TOKEN': process.env.TWITTER_ACCESS_TOKEN,
  'TWITTER_ACCESS_TOKEN_SECRET': process.env.TWITTER_ACCESS_TOKEN_SECRET
};

for (const [key, value] of Object.entries(configs)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
}

console.log('\n2. Testing Bearer Token Connection:');
console.log('-----------------------------------');

async function testBearerToken() {
  try {
    if (!process.env.TWITTER_BEARER_TOKEN) {
      throw new Error('TWITTER_BEARER_TOKEN not set');
    }

    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const v2Client = client.v2;
    
    // Test 1: Get user by username
    console.log('🔍 Looking up @userownedai...');
    const user = await v2Client.userByUsername('userownedai', {
      'user.fields': ['id', 'name', 'description', 'public_metrics']
    });
    
    if (user.data) {
      console.log('✅ User found!');
      console.log(`   Name: ${user.data.name}`);
      console.log(`   Followers: ${user.data.public_metrics?.followers_count || 'N/A'}`);
      console.log(`   Following: ${user.data.public_metrics?.following_count || 'N/A'}`);
    }

    // Test 2: Get following list
    console.log('\n🔍 Testing following list access...');
    const following = await v2Client.following(user.data.id, {
      max_results: 5,
      'user.fields': ['id', 'name', 'username']
    });

    console.log(`✅ Following API accessible! Found ${following.data?.length || 0} accounts`);
    
    return true;
  } catch (error) {
    console.error('❌ Bearer Token Error:', error.message);
    if (error.code === 429) {
      console.error('   Rate limit exceeded. Wait 15 minutes.');
    } else if (error.code === 403) {
      console.error('   Access forbidden. Check API tier permissions.');
    }
    return false;
  }
}

console.log('\n3. Testing OAuth 1.0a Connection:');
console.log('---------------------------------');

async function testOAuth() {
  try {
    const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET } = process.env;
    
    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
      throw new Error('OAuth credentials incomplete');
    }

    const client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: TWITTER_ACCESS_TOKEN,
      accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Test authenticated endpoint
    const me = await client.v2.me();
    console.log('✅ OAuth authentication successful!');
    console.log(`   Authenticated as: @${me.data.username}`);
    
    return true;
  } catch (error) {
    console.error('❌ OAuth Error:', error.message);
    return false;
  }
}

// Run all tests
(async () => {
  console.log('\n🚀 Running X API Integration Tests...\n');
  
  const bearerResult = await testBearerToken();
  const oauthResult = await testOAuth();
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Bearer Token: ${bearerResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`OAuth 1.0a: ${oauthResult ? '✅ Working' : '❌ Failed'}`);
  
  if (bearerResult || oauthResult) {
    console.log('\n✅ X API is functional! You can use the newsletter system.');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run newsletter:daily');
    console.log('2. Check generated files in data/newsletters/');
    console.log('3. Send to Telegram: npm run newsletter:send');
  } else {
    console.log('\n❌ X API connection failed. Please check:');
    console.log('1. API keys are correctly set in .env');
    console.log('2. Your X Developer account has proper access');
    console.log('3. Rate limits haven\'t been exceeded');
  }
})();