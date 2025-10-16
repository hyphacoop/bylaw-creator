# co-operative bylaw generator

a tool that guides users through creating bylaws for co-operatives using ai-powered generation with ollama models.

## features

- multi-step form for collecting co-operative information
- 12 ollama models to choose from (70B, 32B, and 8B parameter sizes)
- jurisdiction-specific bylaw generation (canadian provinces and territories)
- pdf export functionality
- real-time job processing with status updates
- works within vercel free tier (5-minute function timeout)

## setup

### 1. install dependencies

```bash
npm install
```

### 2. set up upstash redis

for async job processing:

1. go to [upstash.com](https://upstash.com/) and create a free account
2. create a new redis database (free tier: 10,000 commands/day)
3. copy the REST URL and token

### 3. configure environment variables

copy the example file:

```bash
cp .env.example .env
```

required environment variables:

```env
# authentication
APP_PASSWORD=your-secure-password

# upstash redis (for job queue)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# ollama api
OLLAMA_URL=https://roo.ai.hypha.coop/api/generate
OLLAMA_USERNAME=your-username
OLLAMA_PASSWORD=your-password

# frontend (for cors)
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=
```

## development

### option a: traditional development (express + react)

```bash
# start both proxy server and react app
npm run dev
```

or run separately:

```bash
# terminal 1: proxy server
npm run proxy

# terminal 2: react app
npm start
```

app available at [http://localhost:3000](http://localhost:3000)

### option b: vercel local development

```bash
# install vercel cli
npm i -g vercel

# run locally
vercel dev
```

simulates production vercel environment locally.

## deployment

### vercel (recommended)

1. push to github (make repo public for auto-deploy)
2. connect repository in vercel dashboard
3. set environment variables in vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `APP_PASSWORD`
   - `OLLAMA_URL`
   - `OLLAMA_USERNAME`
   - `OLLAMA_PASSWORD`
   - `FRONTEND_URL` (your production url)
   - `REACT_APP_API_URL` (empty string)

4. deploy:

```bash
git push origin main
```

or manually:

```bash
vercel --prod
```

### advantages of vercel

- ✅ automatic https
- ✅ serverless scaling
- ✅ built-in ci/cd
- ✅ 5-minute function timeout (hobby plan)
- ✅ free tier available

## available models

### large models (70B+) - best quality
- gpt oss 120b (65 GB)
- mistral large (73 GB)
- cogito 70b (42 GB)
- deepseek r1 70b (42 GB)
- llama 3.3 70b (42 GB)
- hermes 3 70b (39 GB)

### medium models (20-32B) - balanced
- qwen 3 32b (20 GB) - default
- gpt oss 20b (13 GB)
- qwen 3 coder (18 GB)

### small models (8B) - fastest
- qwen 3 8b (5.2 GB)
- hermes 3 8b (4.7 GB)
- gemma 3 (3.3 GB)

## architecture

### job processing flow

1. **submit job** (`/api/jobs/submit`): accepts form data, starts processing
2. **poll status** (`/api/jobs/status`): frontend polls for progress
3. **get results**: results delivered when complete

### benefits

- ✅ no timeout issues (processes within 5-minute limit)
- ✅ real-time progress updates
- ✅ fault tolerant (jobs persist in redis)
- ✅ works on vercel free tier

## api endpoints

### authentication
- `POST /api/auth/login` - authenticate with APP_PASSWORD
- `POST /api/auth/logout` - end session
- `GET /api/auth/status` - check auth status

### job processing
- `POST /api/jobs/submit` - submit bylaw generation job
- `GET /api/jobs/status?jobId=xxx` - check job status and get results

## security

- password-protected access
- secure session cookies
- cors restricted to frontend domain
- encrypted credentials support (optional)

## building for production

```bash
npm run build
```

builds optimized production bundle to `build/` folder.

## license

see LICENSE file for details.
