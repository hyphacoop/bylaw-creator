# Quick Setup Guide: Async Job Processing

This guide helps you set up unlimited processing time on Vercel free tier using async job processing.

## 🚀 Quick Steps

### 1. Set Up Upstash Redis (2 minutes)

1. Go to [Upstash Redis](https://upstash.com/) 
2. Sign up for free account
3. Click "Create Database"
4. Choose "Global" region for best performance
5. Copy the **REST URL** and **REST TOKEN** from your dashboard

### 2. Update Environment Variables

Add these to your `.env` file:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 3. Deploy to Vercel

```bash
# Install dependencies
npm install

# Deploy to Vercel
vercel

# Add environment variables in Vercel dashboard:
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
# CLAUDE_API_KEY (your existing key)
```

## ✅ How It Works

**Before (60s timeout):**
```
User submits form → API calls Claude → Response (TIMEOUT!)
```

**After (unlimited time):**
```
User submits form → Job created → Return job ID immediately
Background: Job processes → Claude API call → Store result
Frontend: Polls job status → Gets result when ready
```

## 🔄 User Experience

1. User clicks "Generate Bylaws"
2. **Immediate response**: "Your request has been submitted..."
3. **Progress updates**: "Processing bylaws...", "Generating with AI..."
4. **Completion**: Results automatically appear

## 📊 Benefits

- ✅ **No timeouts** - Process can take 5+ minutes
- ✅ **Real-time progress** - Users see what's happening  
- ✅ **Fault tolerant** - Works even if browser closes
- ✅ **Free tier compatible** - Each API call is under 60s
- ✅ **Better UX** - No more mysterious timeouts

## 🆓 Free Tier Limits

- **Upstash**: 10,000 requests/day (very generous)
- **Vercel**: Still 60s per function (but each function call is now quick)
- **Claude API**: Your existing limits apply

## 🛠️ Testing

After deployment, test with a complex bylaw generation that would normally timeout. You should see:

1. Immediate job submission response
2. Progress updates every 2 seconds
3. Final result delivery without timeouts 