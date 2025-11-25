# IMGNAI Auto-Generator

An automated image generation tool that interfaces with imgnai.com to generate AI images using browser automation.

## Features

- 🤖 Automated login with Cloudflare bypass
- 🔐 Persistent session management with JWT tokens
- 🎨 20+ AI models support (Gen, Illustrious, Volt, Neo, Flux, and more)
- ⚡ Quality settings (Fast/High Quality)
- 📐 Multiple aspect ratios (5:2, 16:9, 1:1, 4:5, 4:7)
- 📦 Batch image generation (4 images per request)
- 💾 Automatic image downloading
- 🐛 Debug screenshot capture for troubleshooting

## How to Use

### Interactive Mode (Main Script)

Run the interactive generator:
```bash
node reverse.mjs
```

The tool will:
1. Launch a headless browser
2. Authenticate with imgnai.com
3. Prompt you for:
   - Image prompt/description
   - Model selection (1-20)
   - Quality level (1-2)
   - Aspect ratio (1-5)
4. Generate 4 images per request
5. Download images to the `outputs/` directory
6. Allow multiple generations in the same session

Type `exit` when prompted to quit the application.

### Batch Mode (All Models)

The `test.mjs` script includes functionality to generate images across all models:
```bash
node test.mjs
```

## Project Structure

```
.
├── reverse.mjs          # Main interactive script
├── test.mjs             # Batch processing script
├── package.json         # Dependencies
├── outputs/             # Generated images (downloaded)
├── modelImage/          # Organized by model with manifests
├── bugScreenshot/       # Debug screenshots
└── imgnai-profile/      # Browser profile data
```

## Dependencies

- **puppeteer** - Browser automation core
- **puppeteer-real-browser** - Enhanced Puppeteer with turnstile/Cloudflare support
- **playwright** - Additional browser automation
- **date-fns** - Date formatting utilities

## Configuration

Authentication credentials are configured in the script:
- Username: `imgnai69`
- Password: `imgnai@1trick.net`

The tool maintains a persistent browser profile in `./imgnai-profile` to preserve sessions across runs.

## API Mappings

### Models (20 available)
Gen, Illustrious, Volt, Neo, Fur, Ani, Muse, HyperCGI, Nai, Noob, Pony, Flux, RealX, Supra, Evo, Toon, Wassie, RealX Classic, HyperX Classic, FurXl Classic

### Quality Levels
1. **Fast** - Quick generation (30 steps)
2. **High Quality** - Better results (75 steps)

### Aspect Ratios
1. 5:2 (1024x409)
2. 16:9 (896x512)
3. 1:1 Square (512x512)
4. 4:5 (512x640)
5. 4:7 (512x896)

## System Requirements

This application requires:
- Node.js 20+
- Chromium browser
- X11 libraries for headless browser operation

On Replit, these are automatically configured via the `.replit` configuration.

## Troubleshooting

### Browser Launch Issues
If you encounter browser launch errors, ensure:
- Chromium is installed
- CHROME_PATH environment variable is set
- X11 libraries are available

### Login/Authentication Issues
- Check `bugScreenshot/` directory for debug screenshots
- The tool captures screenshots at each step of authentication
- Session data is stored in `imgnai-profile/` directory

### Generation Timeouts
- Fast quality typically takes 10-20 seconds
- High quality can take 30-60 seconds
- The tool polls every 2 seconds for up to 6 minutes

## Output

Generated images are saved to:
- **outputs/** - Raw timestamped images
- **modelImage/<ModelName>/** - Organized by model with manifest files

Each model folder contains a `manifest.json` with metadata about generated images.

## Notes

- The browser runs in headless mode for Replit compatibility
- Browser profile data persists between runs to maintain authentication
- Debug screenshots are automatically captured during operation
- The tool handles Cloudflare challenges automatically
