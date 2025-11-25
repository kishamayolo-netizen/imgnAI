# IMGNAI Auto-Generator

## Overview
This is an automated image generation tool that interfaces with imgnai.com to generate AI images using Puppeteer browser automation. The project uses headless browser automation to log into the imgnai service, submit image generation requests, and download the results.

## Project Structure
- `api-server.mjs` - REST API server for web frontend integration (runs on port 5000)
- `reverse.mjs` - Main script for interactive CLI image generation
- `test.mjs` - Batch processing script for generating images across all models
- `package.json` - Node.js dependencies
- `public/` - Web frontend with HTML interface
- `bugScreenshot/` - Debug screenshots from browser automation
- `outputs/` - Generated images output directory
- `modelImage/` - Organized images by model with manifests
- `imgnai-profile/` - Browser profile data for persistent sessions

## Current State
The project is now running as a web API server on port 5000, accessible through the Replit webview. It includes:
- REST API server with endpoints for authentication and image generation
- Web frontend interface for easy interaction
- Automated login with Cloudflare bypass
- Session management with JWT tokens
- Multiple AI model support (20+ models)
- Quality and aspect ratio options
- Batch image generation (4 images per request)
- Automatic image downloading
- Debug screenshot capture for troubleshooting
- Graceful shutdown with browser cleanup to prevent resource leaks

**How to Access**: The server is running on port 5000 and accessible through the Replit webview. You can also use the CLI tool by running `node reverse.mjs` in the Shell for interactive image generation.

## How to Use
Run the main script with:
```bash
node reverse.mjs
```

The tool will:
1. Launch a headless browser
2. Authenticate with imgnai.com
3. Prompt for image generation settings (prompt, model, quality, aspect ratio)
4. Generate 4 images per request
5. Download images to the `outputs/` directory
6. Allow multiple generations in the same session

Type 'exit' when prompted to quit the application.

## Dependencies
- `puppeteer` - Browser automation
- `puppeteer-real-browser` - Enhanced Puppeteer with turnstile support
- `playwright` - Additional browser automation support
- `date-fns` - Date formatting utilities

## Configuration
Authentication credentials are stored in the script:
- Username: imgnai69
- Password: imgnai@1trick.net

The tool uses a persistent browser profile stored in `./imgnai-profile` to maintain sessions.

## API Mappings
The script includes mappings for:
- 20 AI models (Gen, Illustrious, Volt, Neo, Flux, etc.)
- 2 quality levels (Fast, High Quality)
- 5 aspect ratios (5:2, 16:9, 1:1, 4:5, 4:7)

## Recent Changes
- 2025-11-25: Fixed API server to run properly in Replit
  - Changed server port from 3000 to 5000 for Replit compatibility
  - Added browser cleanup function to prevent resource leaks
  - Implemented graceful shutdown handlers (SIGTERM, SIGINT, uncaughtException)
  - Configured server to bind to 0.0.0.0 for Replit environment
  - Updated workflow configuration to use webview on port 5000
  - Fixed "fork: Resource temporarily unavailable" errors
  - Server is now fully functional and accessible through webview

- 2025-11-25: Initial Replit setup completed
  - Configured .gitignore for Node.js project
  - Created project documentation (README.md, replit.md)
  - Verified all dependencies are installed
  - Installed system dependencies: Chromium, X11 libraries, xvfb-run
  - Configured environment variables: CHROME_PATH, PUPPETEER_EXECUTABLE_PATH
  - Fixed navigation timeout issue: Changed from `networkidle0` to `domcontentloaded`
  - Created info server (server.mjs) to keep Replit active with usage instructions
  - Application is fully functional in Replit environment

## User Preferences
None specified yet.

## Project Architecture
This is a Node.js application with both API server and CLI modes:
- **API Server Mode**: Express.js REST API running on port 5000
  - Endpoints: /health, /models, /auth, /generate, /image/*
  - Web frontend served from public/ directory
  - Browser instance managed with proper cleanup on shutdown
- **CLI Mode**: Interactive command-line interface (reverse.mjs)
  - Direct user prompts for image generation
  - Run manually in Shell when needed
- **Technical Stack**:
  - ES modules (.mjs files)
  - Headless browser automation with Puppeteer
  - Direct API interaction through browser context
  - File system operations for image storage and debugging
