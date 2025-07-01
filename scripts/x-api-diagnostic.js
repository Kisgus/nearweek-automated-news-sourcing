#!/usr/bin/env node

require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function comprehensiveDiagnostic() {
  console.log('🔍 Comprehensive X API Diagnostic');
  console.log('==================================\n');
  
  // 1. Environment Check
  console.log('1️⃣ Environment Variables Check:');
  console.log('--------------------------------');
  const envVars = {
    'TWITTER_API_KEY': process.env.TWITTER_API_KEY,
    'TWITTER_API_SECRET': process.env.TWITTER_API_SECRET,
    'TWITTER_BEARER_TOKEN': process.env.TWITTER_BEARER_TOKEN,
    'TWITTER_ACCESS_TOKEN': process.env.TWITTER_ACCESS_TOKEN,
    'TWITTER_ACCESS_TOKEN_SECRET': process.env.TWITTER_ACCESS_TOKEN_SECRET
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`✅ ${key}: ${value.length} chars`);
    } else {
      console.log(`❌ ${key}: NOT SET`);
    }
  }
  
  // 2. Test Bearer Token Authentication
  console.log('\n2️⃣ Testing Bearer Token Authentication:');
  console.log('---------------------------------------');
  
  try {
    const bearerClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    
    // Test rate limit status
    const rateLimits = await bearerClient.v2.getRateLimitStatus();
    console.log('✅ Bearer Token Valid - Rate limits accessible');
    
    // Test user lookup
    try {
      const user = await bearerClient.v2.userByUsername('elonmusk');
      console.log('✅ User lookup working:', user.data.name);
    } catch (e) {
      console.log('❌ User lookup failed:', e.message);
    }
    
    // Test search (Basic tier feature)
    try {
      console.log('\nTesting search API...');
      const searchResults = await bearerClient.v2.search('from:elonmusk', {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics']
      });
      console.log('✅ Search API working! Found', searchResults.data?.length || 0, 'tweets');
    } catch (searchError) {
      console.log('❌ Search API Error:', searchError.message);
      if (searchError.data) {
        console.log('   Error details:', JSON.stringify(searchError.data, null, 2));
      }
    }
    
  } catch (error) {
    console.log('❌ Bearer Token Error:', error.message);
  }
  
  // 3. Test OAuth 1.0a Authentication
  console.log('\n3️⃣ Testing OAuth 1.0a Authentication:');
  console.log('-------------------------------------');
  
  try {
    const oauthClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
    
    const me = await oauthClient.v2.me();
    console.log('✅ OAuth authentication working! Authenticated as:', me.data.username);
  } catch (oauthError) {
    console.log('❌ OAuth Error:', oauthError.message);
    if (oauthError.code === 401) {
      console.log('   → Access tokens are invalid or expired');
      console.log('   → Please regenerate them in X Developer Portal');
    }
  }
  
  // 4. Test the actual newsletter functionality
  console.log('\n4️⃣ Testing Newsletter Functionality:');
  console.log('------------------------------------');
  
  try {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    
    // Get userownedai user
    const user = await client.v2.userByUsername('userownedai');
    console.log('✅ Found @userownedai:', user.data.id);
    
    // Try to get following list
    try {
      const following = await client.v2.following(user.data.id, {
        max_results: 5,
        'user.fields': ['username', 'name']
      });
      console.log('✅ Following list accessible:', following.data?.length || 0, 'accounts');
    } catch (followingError) {
      console.log('❌ Following list error:', followingError.message);
      if (followingError.code === 403) {
        console.log('   → This endpoint requires user context (OAuth)');
      }
    }
    
    // Try timeline as alternative
    try {
      const timeline = await client.v2.userTimeline(user.data.id, {
        max_results: 5,
        exclude: ['retweets', 'replies']
      });
      console.log('✅ Timeline accessible:', timeline.data?.length || 0, 'tweets');
    } catch (timelineError) {
      console.log('❌ Timeline error:', timelineError.message);
    }
    
  } catch (error) {
    console.log('❌ Newsletter functionality error:', error.message);
  }
  
  // 5. Diagnosis Summary
  console.log('\n5️⃣ Diagnosis Summary:');
  console.log('--------------------');
  
  if (process.env.TWITTER_BEARER_TOKEN?.length === 112) {
    console.log('✅ Bearer Token: Properly configured');
  } else {
    console.log('❌ Bearer Token: Invalid length');
  }
  
  if (process.env.TWITTER_ACCESS_TOKEN?.length > 45) {
    console.log('✅ Access Token: Proper length');
  } else {
    console.log('❌ Access Token: Too short (needs regeneration)');
  }
  
  console.log('\n📊 Recommended Solution:');
  console.log('========================');
  console.log('1. The main issue is the X API search returning 400 errors');
  console.log('2. This happens when:');
  console.log('   - Search query syntax is invalid');
  console.log('   - API app doesn\'t have proper permissions');
  console.log('   - Basic tier isn\'t fully activated');
  console.log('\n3. Try this test search that should work:');
  console.log('   await client.v2.search("AI", { max_results: 10 })');
  console.log('\n4. If OAuth tokens show 401 errors, regenerate them in X Developer Portal');
}

// Run diagnostic
comprehensiveDiagnostic().catch(console.error);