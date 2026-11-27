# co-operative bylaw generator

a tool that guides users through creating bylaws for co-operatives using ai-powered generation with ollama models.

## features

- multi-step form for collecting co-operative information
- choice of ollama models (large, medium and small)
- jurisdiction-specific bylaw generation (canadian provinces and territories)
- pdf export functionality
- background job processing with status updates
- runs locally or as a single docker container

## requirements

- an [ollama](https://ollama.com/) api you can reach (hosted, e.g. `roo.ai.hypha.coop`, or one running on your machine)
- node.js 18+ and npm for local development, **or** docker

no database or external queue is needed: jobs are kept in memory by the server.

## configuration

copy the example file and edit it:

```bash
cp .env.example .env
```

| variable | required | description |
| --- | --- | --- |
| `APP_PASSWORD` | yes | password users enter to access the app |
| `SESSION_SECRET` | yes (production) | secret used to sign session cookies. generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OLLAMA_URL` | yes | ollama base url (`http://localhost:11434`) or full `/api/generate` url |
| `OLLAMA_USERNAME` / `OLLAMA_PASSWORD` | no | http basic auth for the ollama api, if it needs it |
| `OLLAMA_NUM_PREDICT` | no | max tokens generated per request (default `12000`) |
| `OLLAMA_NUM_CTX` | no | context window size (default: the ollama server/model default) |
| `OLLAMA_THINK` | no | let reasoning models think before answering (default `false`). thinking uses up the token budget and can cut the bylaws short |
| `COOKIE_SECURE` | no | set to `true` when served over https (default `false`) |
| `PORT` | no | server port (default `4000`) |
| `FRONTEND_URL` / `REACT_APP_API_URL` | no | only needed if the ui and api are served from different origins |

check that the server can reach ollama:

```bash
npm install
npm run test-ollama -- qwen3.5:9b
```

## running locally (development)

```bash
npm install
npm run dev
```

this starts the express api on [http://localhost:4000](http://localhost:4000) and the react dev server on [http://localhost:3000](http://localhost:3000). the dev server forwards `/api` requests to the express server, so open http://localhost:3000.

to run a production build locally from a single process:

```bash
npm run start:prod   # builds the ui, then serves ui + api on http://localhost:4000
```

## running with docker

```bash
cp .env.example .env      # then edit it
docker compose up --build -d
```

open [http://localhost:4000](http://localhost:4000). set `HOST_PORT` to publish on a different port, e.g. `HOST_PORT=8080 docker compose up -d`.

if ollama runs on the docker host, set `OLLAMA_URL=http://host.docker.internal:11434` (the compose file maps that hostname to the host). ollama has to listen on an interface the container can reach, e.g. `OLLAMA_HOST=0.0.0.0`.

without compose:

```bash
docker build -t bylaw-creator .
docker run -d -p 4000:4000 --env-file .env --add-host host.docker.internal:host-gateway bylaw-creator
```

the container runs as a non-root user, exposes port 4000, and has a healthcheck at `/api/health`. put it behind an https reverse proxy for public deployments, and set `COOKIE_SECURE=true`.

## available models

### large models (70B+) - best quality
- qwen 3.5 35b (23 GB)
- gpt oss 120b (65 GB)
- mistral large (73 GB)
- cogito 70b (42 GB)
- deepseek r1 70b (42 GB)
- llama 3.3 70b (42 GB)
- hermes 3 70b (39 GB)

### medium models (balanced)
- qwen 3.5 9b (6 GB) - default
- qwen 3.5 27b (17 GB)
- qwen 3 32b (20 GB)
- gpt oss 20b (13 GB)
- qwen 3 coder (18 GB)

### small models (8B) - fastest
- qwen 3.5 2b (2.7 GB)
- qwen 3 8b (5.2 GB)
- hermes 3 8b (4.7 GB)
- gemma 3 (3.3 GB)

## architecture

- `src/`: react frontend (create react app + tailwind)
- `server/lib/`: backend logic (auth, ollama client, jobs)
- `server/index.js`: express server for local development and docker. it serves `/api/*` and, when a build exists, the ui

### job processing flow

1. **submit job** (`POST /api/jobs/submit`): validates the payload and starts generation. returns `202` with a `jobId`.
2. **poll status** (`GET /api/jobs/status?jobId=xxx`): the frontend polls until the job is `completed` or `failed`
3. jobs are kept in memory for 24 hours. they are lost if the server restarts.

## api endpoints

- `GET /api/health`: liveness check (process is up; also reports uptime, version and job counts)
- `GET /api/ready`: readiness check (config is valid and ollama is reachable with the configured credentials)
- `POST /api/auth/login`: authenticate with `APP_PASSWORD`
- `POST /api/auth/logout`: end the session
- `GET /api/auth/status`: check auth status
- `POST /api/jobs/submit`: submit a bylaw generation job
- `GET /api/jobs/status?jobId=xxx`: check job status and get results

## monitoring

two unauthenticated endpoints, both sent with `Cache-Control: no-store`:

- **`GET /api/health`** (liveness) always returns `200` while the process is running. it makes no external calls, so use it for container healthchecks and restarts. the docker image's `HEALTHCHECK` uses it.

  ```json
  {"status":"ok","version":"0.1.0","uptimeSeconds":3600,"jobs":{"queued":0,"processing":1,"completed":12,"failed":0}}
  ```

- **`GET /api/ready`** (readiness) returns `200` when everything is working and `503` otherwise. it checks that `APP_PASSWORD` is set and calls ollama's `/api/version` with the configured credentials (5s timeout). results are cached for 5 seconds. point uptime monitors and alerts here.

  ```json
  {"status":"error","version":"0.1.0","checks":{"config":{"ok":true},"ollama":{"ok":false,"latencyMs":5003,"error":"timed out"}}}
  ```

neither endpoint exposes configuration values or credentials.

## security

- password-protected access (constant-time comparison)
- hmac-signed, httponly, samesite session cookie (no credentials stored in the cookie)
- ollama credentials stay on the server

## license

see LICENSE file for details.
