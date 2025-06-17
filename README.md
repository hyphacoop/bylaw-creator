# Co-operative Bylaw Generator

A tool that guides users through creating bylaws for co-operatives, following legal requirements for different jurisdictions by using web_search.

## Environment Setup

Copy the `env.example` file to `.env` and configure your settings:

```bash
npm run setup-env
```

### Security Options

**Option 1: Basic Setup (Less Secure)**
```bash
# In .env file
CLAUDE_API_KEY=your-claude-api-key-here
OLLAMA_URL=https://roo.ai.hypha.coop/api/generate
OLLAMA_USERNAME=roo
OLLAMA_PASSWORD=your-ollama-password-here
APP_PASSWORD=your-secure-password
```

**Option 2: Encrypted API Keys (More Secure)**
```bash
# Encrypt your API keys
npm run encrypt-key

# Then update .env with the encrypted keys
CLAUDE_API_KEY_ENCRYPTED=your-encrypted-claude-key-from-script
OLLAMA_URL=https://roo.ai.hypha.coop/api/generate
OLLAMA_USERNAME=roo
OLLAMA_PASSWORD_ENCRYPTED=your-encrypted-ollama-password-from-script
APP_PASSWORD=your-password-used-for-encryption
```

### Required Environment Variables

**Authentication:**
- `APP_PASSWORD`: Password to access the application
- `SESSION_SECRET`: Secure random string for session encryption

**Claude API (Anthropic):**
- `CLAUDE_API_KEY` OR `CLAUDE_API_KEY_ENCRYPTED`: Your Claude API key

**Ollama API (Optional, for Ollama models):**
- `OLLAMA_URL`: Ollama API endpoint (default: https://roo.ai.hypha.coop/api/generate)
- `OLLAMA_USERNAME`: Username for Ollama API (e.g., "roo")  
- `OLLAMA_PASSWORD` OR `OLLAMA_PASSWORD_ENCRYPTED`: Your Ollama API password

**Frontend:**
- `REACT_APP_CLAUDE_MODEL`: Default AI model (default: claude-3-5-sonnet-20241022)

## Development

Install dependencies:

```bash
npm install
```

### Option A: Traditional Development (Express + React)

Start both the proxy server and React app:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Start the proxy server
npm run proxy

# Terminal 2: Start the React app
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000) and the proxy server at [http://localhost:4000](http://localhost:4000).

### Option B: Vercel Local Development

Test the Vercel deployment locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel
vercel dev
```

This runs both frontend and serverless functions locally, simulating the production Vercel environment.

## Building for Production

```bash
npm run build
```

## Deployment Options

Choose your preferred deployment method:

### 🚀 Option 1: Vercel (Single Platform - Recommended)

Deploy everything to Vercel in one place - no separate frontend/backend needed!

```bash
npm run deploy-vercel
```

This will guide you through:
- Setting up secure environment variables
- Configuring API key encryption
- One-command deployment to Vercel

**Advantages:**
- ✅ Single platform deployment
- ✅ Automatic HTTPS
- ✅ Serverless scaling
- ✅ Built-in CI/CD
- ✅ Free tier available

### 🔧 Option 2: Separate Frontend/Backend

For more control or different hosting preferences.

#### Deployment Architecture

```
User → [Password-Protected Frontend] → [Authenticated Backend] → Claude API
```

### 1. Backend Deployment (Node.js Server)

Deploy `proxy-server.js` to services like:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean App Platform**: Connect repo
- **Render**: Connect GitHub repo

**Environment Variables for Backend:**
```bash
APP_PASSWORD=your-secure-password
SESSION_SECRET=random-32-character-string
CLAUDE_API_KEY_ENCRYPTED=your-encrypted-key
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=4000
```

### 2. Frontend Deployment (Static Site)

Deploy the `build/` folder to:
- **Netlify**: Drag & drop or GitHub integration
- **Vercel**: GitHub integration
- **GitHub Pages**: Upload to gh-pages branch

**Environment Variables for Frontend:**
```bash
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 3. Security Checklist

- ✅ Use encrypted API key (`npm run encrypt-key`)
- ✅ Set strong `APP_PASSWORD` (minimum 12 characters)
- ✅ Generate secure `SESSION_SECRET` (32+ random characters)
- ✅ Enable HTTPS on both frontend and backend
- ✅ Restrict CORS to your frontend domain only
- ✅ Never commit `.env` files to git

### 4. Production Example

```bash
# Backend: https://bylaw-api.herokuapp.com
# Frontend: https://bylaw-creator.netlify.app

# Backend .env:
APP_PASSWORD=MySecurePassword123!
CLAUDE_API_KEY_ENCRYPTED=a1b2c3d4e5f6...
FRONTEND_URL=https://bylaw-creator.netlify.app
NODE_ENV=production

# Frontend build env:
REACT_APP_API_URL=https://bylaw-api.herokuapp.com
```

### 5. Alternative: Docker Deployment

For self-hosting, consider containerizing both services with Docker Compose for easier management.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
