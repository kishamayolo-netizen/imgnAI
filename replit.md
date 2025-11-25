# IMGNAI Auto-Generator

## Overview
This is an automated image generation tool that interfaces with imgnai.com to generate AI images using Puppeteer browser automation. The project uses headless browser automation to log into the imgnai service, submit image generation requests, and download the results.

## Project Structure
- `reverse.mjs` - Main script for interactive image generation
- `test.mjs` - Batch processing script for generating images across all models
- `package.json` - Node.js dependencies
- `bugScreenshot/` - Debug screenshots from browser automation
- `outputs/` - Generated images output directory
- `modelImage/` - Organized images by model with manifests
- `imgnai-profile/` - Browser profile data for persistent sessions

## Current State
The project is fully functional as a CLI tool in the Replit environment. It includes:
- Automated login with Cloudflare bypass
- Session management with JWT tokens
- Multiple AI model support (20+ models)
- Quality and aspect ratio options
- Batch image generation
- Automatic image downloading
- Debug screenshot capture for troubleshooting

**Important Note**: This is an interactive CLI application. The workflow will appear to be waiting because it expects user input through stdin. To use the tool:
1. Stop the workflow if it's running
2. Run `node reverse.mjs` in the Shell
3. Interact with the prompts to generate images

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
- 2025-11-25: Initial Replit setup completed
  - Configured .gitignore for Node.js project
  - Created project documentation (README.md, replit.md)
  - Verified all dependencies are installed
  - Installed system dependencies: Chromium, X11 libraries, xvfb
  - Configured environment variables: CHROME_PATH, PUPPETEER_EXECUTABLE_PATH
  - Set up workflow for running the CLI tool
  - Application is fully functional in Replit environment

## User Preferences
None specified yet.

## Project Architecture
This is a Node.js CLI application using:
- ES modules (.mjs files)
- Headless browser automation with Puppeteer
- Direct API interaction through browser context
- File system operations for image storage and debugging
