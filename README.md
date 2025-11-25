# IMGNAI Auto-Generator

An automated image generation tool that interfaces with imgnai.com to generate AI images using browser automation. Now with a REST API server!

## Features

- 🤖 Automated login with Cloudflare bypass
- 🔐 Persistent session management with JWT tokens
- 🎨 20+ AI models support (Gen, Illustrious, Volt, Neo, Flux, and more)
- ⚡ Quality settings (Fast/High Quality)
- 📐 Multiple aspect ratios (5:2, 16:9, 1:1, 4:5, 4:7)
- 📦 Batch image generation (4 images per request)
- 💾 Automatic image downloading
- 🌐 REST API Server for frontend integration
- 🐛 Debug screenshot capture for troubleshooting

## How to Use

### API Server Mode (Recommended)

Run the API server to accept requests from your frontend:
```bash
node api-server.mjs
```

The server starts on port 3000 with these endpoints:

**Check Server Status**
```bash
GET /health
```

**Get Available Models & Settings**
```bash
GET /models
```
Returns all models (IDs 1-20), quality levels, and aspect ratios.

**Authenticate with imgnai.com**
```bash
POST /auth
```
Call this first to initialize authentication.

**Generate Images**
```bash
POST /generate
Content-Type: application/json

{
  "prompt": "a magical cat wizard",
  "modelId": 12,
  "qualityId": 2,
  "ratioId": 3
}
```

**Example cURL Request:**
```bash
# Get models
curl http://localhost:3000/models

# Authenticate
curl -X POST http://localhost:3000/auth

# Generate images
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a magical cat","modelId":12,"qualityId":2,"ratioId":3}'
```

**Response:**
```json
{
  "success": true,
  "urls": ["https://wasmall.imgnai.com/image1.jpg", ...],
  "timings": {...},
  "message": "Generated 4 images"
}
```

### Interactive Mode (CLI)

Run the interactive generator:
```bash
node reverse.mjs
```

Prompts you for image settings and generates 4 images per request.

### Batch Mode

Generate images across all models:
```bash
node test.mjs
```

## Project Structure

```
.
├── api-server.mjs       # REST API server for frontend integration
├── reverse.mjs          # Interactive CLI script
├── test.mjs             # Batch processing script
├── server.mjs           # Info server
├── package.json         # Dependencies
├── outputs/             # Generated images (downloaded)
├── modelImage/          # Organized by model with manifests
├── bugScreenshot/       # Debug screenshots
└── imgnai-profile/      # Browser profile data
```

## Dependencies

- **express** - REST API framework
- **puppeteer** - Browser automation core
- **puppeteer-real-browser** - Enhanced Puppeteer with Cloudflare support
- **playwright** - Additional browser automation
- **date-fns** - Date formatting utilities

## Configuration

Authentication credentials (hardcoded in scripts):
- Username: `imgnai69`
- Password: `imgnai@1trick.net`

Browser profile stored in `./imgnai-profile` persists sessions.

## API Reference

### Model IDs (1-20)
Gen, Illustrious, Volt, Neo, Fur, Ani, Muse, HyperCGI, Nai, Noob, Pony, Flux, RealX, Supra, Evo, Toon, Wassie, RealX Classic, HyperX Classic, FurXl Classic

### Quality IDs
- 1: Fast (30 steps, ~10-20 seconds)
- 2: High Quality (75 steps, ~30-60 seconds)

### Aspect Ratio IDs
- 1: 5:2 (1024x409)
- 2: 16:9 (896x512)
- 3: 1:1 Square (512x512)
- 4: 4:5 (512x640)
- 5: 4:7 (512x896)

## System Requirements

- Node.js 20+
- Chromium browser
- X11 libraries for headless operation

All are pre-configured on Replit.

## Troubleshooting

**Browser Issues:** Check `bugScreenshot/` folder for debug screenshots at each auth step

**Login Failures:** Session data in `imgnai-profile/` may be stale - delete it and re-authenticate

**Generation Timeouts:** High quality takes longer. Check `/health` endpoint to verify server is running

## Notes

- Browser runs headless for Replit compatibility
- Sessions persist between runs
- Debug screenshots captured automatically for troubleshooting
- Cloudflare challenges handled automatically
