# Deployment Guide

This guide explains how to deploy the Classroom Seating Manager app with secure API key protection.

## Overview

The application now includes a basic authentication system that protects your Gemini API key. Instead of storing the API key in the frontend code, users must enter a password ("cs188ucla") to access the application, and the server provides the API key only after successful authentication.

## Architecture

- **Frontend**: React app that prompts for authentication
- **Backend**: Express server that validates passwords and provides API keys
- **Authentication**: Session-based (stored in sessionStorage, cleared on tab close)

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run in development mode**:
   ```bash
   # Option 1: Run frontend and backend separately
   npm run dev:server    # Terminal 1 - Backend on port 3001
   npm run dev          # Terminal 2 - Frontend on port 5173

   # Option 2: Run both together
   npm run dev:full     # Runs both with concurrently
   ```

## Production Deployment

### 1. Build the Frontend

```bash
npm run build
```

This creates a `dist/` folder with the production-ready frontend.

### 2. Set Environment Variables

Set the `GEMINI_API_KEY` environment variable on your production server:

```bash
export GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the Production Server

```bash
npm start
```

This starts the Express server with `NODE_ENV=production`, which:
- Serves the built React app from the `dist/` folder
- Handles API authentication on `/api/auth`
- Serves the React app for all other routes (SPA routing)

### 4. Deploy to Various Platforms

#### Heroku
1. Create a `Procfile`:
   ```
   web: npm start
   ```

2. Set environment variables:
   ```bash
   heroku config:set GEMINI_API_KEY=your_actual_api_key_here
   ```

#### Vercel/Netlify
For serverless platforms, you'll need to:
1. Deploy the frontend (built with `npm run build`)
2. Create a separate serverless function for authentication
3. Update the frontend to call your serverless auth endpoint

#### VPS/Cloud Server
1. Install Node.js and npm
2. Clone your repository
3. Set environment variables
4. Run `npm install` and `npm run build`
5. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name seating-app
   ```

## Security Notes

1. **Password**: The current password is hardcoded as "cs188ucla". You can change it in `server.js`.
2. **HTTPS**: Use HTTPS in production to protect the API key during transmission.
3. **Environment Variables**: Never commit the `.env` file or expose API keys in client-side code.
4. **Session Storage**: API keys are stored in sessionStorage (cleared when tab closes) rather than localStorage for better security.

## Configuration

### Changing the Password

Edit `server.js` and change this line:
```javascript
if (password === 'cs188ucla') {
```

### Custom Port

Set the `PORT` environment variable:
```bash
export PORT=8080
npm start
```

## Troubleshooting

1. **CORS Issues**: Make sure the Vite proxy is configured correctly for development (already set up in `vite.config.js`).

2. **API Key Not Found**: Ensure the `GEMINI_API_KEY` environment variable is set on the server.

3. **Authentication Failing**: Check browser dev tools for network errors on the `/api/auth` endpoint.

4. **Build Issues**: Make sure all dependencies are installed and run `npm run build` before deploying. 