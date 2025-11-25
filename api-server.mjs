// API Server for IMGNAI Auto-Generator
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';
import { connect } from 'puppeteer-real-browser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const BASE_URL = 'https://app.imgnai.com/services/webappms';
const LOGIN_URL = 'https://app.imgnai.com/login';
const GENERATE_URL = 'https://app.imgnai.com/generate';
const PROFILE_DIR = './imgnai-profile';
const IMAGE_BASE_URL = 'https://wasmall.imgnai.com/';

const USERNAME = 'imgnai69';
const PASSWORD = 'imgnai@1trick.net';

const API_MAPPINGS = {
  MODELS: { 1: { name: 'Gen', id: 'Gen' }, 2: { name: 'Illustrious', id: 'Illustrious' }, 3: { name: 'Volt', id: 'Volt' }, 4: { name: 'Neo', id: 'Neo' }, 5: { name: 'Fur', id: 'Fur2' }, 6: { name: 'Ani', id: 'AniPlus' }, 7: { name: 'Muse', id: 'Muse' }, 8: { name: 'HyperCGI', id: 'Hyper2' }, 9: { name: 'Nai', id: 'Nai2' }, 10: { name: 'Noob', id: 'Noob' }, 11: { name: 'Pony', id: 'Pony' }, 12: { name: 'Flux', id: 'FluxPro' }, 13: { name: 'RealX', id: 'Real2' }, 14: { name: 'Supra', id: 'Supra2' }, 15: { name: 'Evo', id: 'Evo' }, 16: { name: 'Toon', id: 'Toon' }, 17: { name: 'Wassie', id: 'Wassie' }, 18: { name: 'RealX Classic', id: 'Ooga2' }, 19: { name: 'HyperX Classic', id: 'HyperX' }, 20: { name: 'FurXl Classic', id: 'FurXl' } },
  QUALITY: { 1: { name: 'Fast', value: true, quality_modifier: 30 }, 2: { name: 'High Quality', value: false, quality_modifier: 75 } },
  ASPECT_RATIO: { 1: { name: '5:2', res: 'WIDE_LARGE', w: 1024, h: 409 }, 2: { name: '16:9', res: 'WIDE_LARGE', w: 896, h: 512 }, 3: { name: '1:1 (Square)', res: 'BOX_X_LARGE', w: 512, h: 512 }, 4: { name: '4:5', res: 'TALL_LARGE', w: 512, h: 640 }, 5: { name: '4:7', res: 'TALL_LARGE', w: 512, h: 896 } }
};

let authContext = null;

const wait = ms => new Promise(r => setTimeout(r, ms));
function getUniquePrefix() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (e) {
    console.error('ensureDir failed:', e.message);
    return false;
  }
}

async function saveDebugScreenshot(page, name) {
  if (!page) return;
  try {
    const dir = './bugScreenshot';
    ensureDir(dir);
    const filename = path.join(dir, `${getUniquePrefix()}_${name}`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`Saved debug screenshot: ${filename}`);
  } catch (e) {
    console.error('saveDebugScreenshot failed:', e.message);
  }
}

async function downloadImage(url, filename) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(filename, buf);
    console.log(`Saved: ${filename}`);
    return true;
  } catch (e) {
    console.error(`Download failed: ${e.message}`);
    return false;
  }
}

async function setupAuthenticatedPage() {
  const times = {};
  times.start = Date.now();
  console.log('Launching browser...');
  const { page, browser } = await connect({
    headless: true,
    turnstile: true,
    userDataDir: PROFILE_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  times.browserLaunched = Date.now();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
  await saveDebugScreenshot(page, '01_after_launch.png');

  try {
    times.gotoStart = Date.now();
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
    times.gotoDone = Date.now();
    await saveDebugScreenshot(page, '02_login_page.png');
  } catch (e) {
    console.error('Goto login failed:', e.message);
    try { await saveDebugScreenshot(page, '02_login_page_error.png'); } catch (e2) {}
    throw e;
  }

  console.log('Bypassing Cloudflare...');
  times.cloudflareStart = Date.now();
  for (let i = 0; i < 30; i++) {
    const challenged = await page.evaluate(() => document.title.includes('Just a moment') || !!document.querySelector('#challenge-form'));
    if (!challenged) break;
    if (i % 3 === 0) {
      await saveDebugScreenshot(page, `03_cloudflare_wait_iter${i}.png`);
    }
    await wait(4000);
  }
  times.cloudflareEnd = Date.now();

  await saveDebugScreenshot(page, '04_after_cloudflare.png');

  const auth = (await page.cookies()).find(c => c.name === 'authentication');
  if (auth) {
    try {
      const obj = JSON.parse(decodeURIComponent(auth.value));
      if (obj.state?.token) {
        console.log(`Already logged in: ${obj.state.username}`);
        times.alreadyLoggedIn = Date.now();
        await page.goto(GENERATE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
        return { page, browser, jwt: obj.state.token, timings: times };
      }
    } catch {}
  }

  console.log('Logging in...');
  try {
    times.waitForUsernameStart = Date.now();
    await page.waitForSelector('input[name="username"]', { timeout: 60000 });
    times.waitForUsernameEnd = Date.now();
  } catch (err) {
    console.warn('Username input did not appear in main document within 60s; will search frames as a fallback');
    times.waitForUsernameEnd = Date.now();
  }

  let typed = false;
  try {
    times.fillStart = Date.now();
    const userEl = await page.$('input[name="username"]');
    const passEl = await page.$('input[name="password"]');
    if (userEl && passEl) {
      await userEl.focus();
      await page.keyboard.type(USERNAME, { delay: 50 });
      await passEl.focus();
      await page.keyboard.type(PASSWORD, { delay: 50 });
      typed = true;
      times.fillEnd = Date.now();
    }
  } catch (te) {
    times.fillEnd = Date.now();
    console.warn('Typing into main document failed:', te.message);
  }

  if (!typed) {
    const frames = page.frames();
    for (let i = 0; i < frames.length && !typed; i++) {
      const f = frames[i];
      try {
        const hasUser = await f.$('input[name="username"]');
        const hasPass = await f.$('input[name="password"]');
        if (hasUser && hasPass) {
          await f.evaluate((UN, PW) => {
            const user = document.querySelector('input[name="username"]');
            const pass = document.querySelector('input[name="password"]');
            if (user) user.value = UN;
            if (pass) pass.value = PW;
            const ev = new Event('input', { bubbles: true });
            if (user) user.dispatchEvent(ev);
            if (pass) pass.dispatchEvent(ev);
          }, USERNAME, PASSWORD);
          typed = true;
          times.fillEnd = Date.now();
          console.log('Filled credentials inside frame:', f.url());
          break;
        }
      } catch (fe) {
        console.warn('Frame fill error for frame', i, fe.message);
      }
    }
  }

  if (!typed) {
    throw new Error('Unable to locate login inputs in main document or any frames');
  }

  await page.click('button[type="submit"]');
  await saveDebugScreenshot(page, '05_after_fill_and_submit.png');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  try {
    await page.goto(GENERATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.error('Goto generate failed:', e.message);
    await saveDebugScreenshot(page, '06_generate_page_error.png');
    throw e;
  }
  await saveDebugScreenshot(page, '06_generate_page.png');

  const finalAuth = (await page.cookies()).find(c => c.name === 'authentication');
  if (!finalAuth) throw new Error('Login failed');
  const authObj = JSON.parse(decodeURIComponent(finalAuth.value));
  if (!authObj.state?.token) throw new Error('No JWT');
  console.log(`Logged in: ${authObj.state.username}`);
  await saveDebugScreenshot(page, '07_authenticated.png');
  times.loginComplete = Date.now();
  times.total = times.loginComplete - times.start;
  return { page, browser, jwt: authObj.state.token, timings: times };
}

async function autoGenerate(settings, context) {
  const runId = getUniquePrefix();
  const { page, browser, jwt: initialJwt } = context;
  let jwt = initialJwt;
  const timings = { runStart: Date.now() };

  try {
    console.log('Creating session...');
    timings.sessionStart = Date.now();
    const sessionUuid = await page.evaluate(async (url, jwt) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Origin': 'https://app.imgnai.com',
          'Referer': 'https://app.imgnai.com/generate'
        }
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`Session failed: ${text}`);
      return text.trim();
    }, `${BASE_URL}/api/generate-session`, jwt);
    timings.sessionEnd = Date.now();
    if (!sessionUuid || sessionUuid.length < 8) throw new Error(`Invalid session: ${sessionUuid}`);
    console.log(`Session UUID: ${sessionUuid}`);

    const batch = Array(4).fill().map((_, i) => ({
      nsfw: false,
      profile: settings.model.id,
      n_steps: settings.quality.quality_modifier,
      strength: 0.76,
      seed: Math.floor(Math.random() * 4e9) + i,
      prompt: settings.prompt,
      negative_prompt: 'low quality, blurry, deformed, bad anatomy',
      input: null,
      width: settings.aspectRatio.w,
      height: settings.aspectRatio.h,
      guidance_scale: 3.5,
      image_resolution: settings.aspectRatio.res,
      is_uhd: false,
      is_fast: settings.quality.value,
      use_assistant: false
    }));

    const payload = { session_uuid: sessionUuid, use_credits: false, use_assistant: false, generate_image_list: batch };

    console.log(`\n--- GENERATING ---`);
    console.log(`Model: ${settings.model.name} | Quality: ${settings.quality.name} | Ratio: ${settings.aspectRatio.name}`);
    console.log(`Prompt: "${settings.prompt}"`);

    timings.submitStart = Date.now();

    let jobIds;
    try {
      jobIds = await page.evaluate(async (url, payload, jwt) => {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Origin': 'https://app.imgnai.com',
            'Referer': 'https://app.imgnai.com/generate'
          },
          body: JSON.stringify(payload)
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`Batch failed: ${text}`);
        try {
          const data = JSON.parse(text);
          return Array.isArray(data) ? data : data.jobIds || [];
        } catch (e) {
          console.error('Raw batch response:', text);
          throw e;
        }
      }, `${BASE_URL}/api/generate-image-batch`, payload, jwt);
    } catch (err) {
      console.error('Batch submission error:', err.message || err);
      throw err;
    }
    timings.submitEnd = Date.now();
    console.log(`Started ${jobIds.length} jobs`);

    const urls = [];
    try {
      const initialDelayMs = settings.quality && settings.quality.value ? 10000 : 20000;
      console.log(`Waiting ${initialDelayMs / 1000}s before polling (quality: ${settings.quality?.name})`);
      timings.pollInitialDelay = initialDelayMs;
      await wait(initialDelayMs);
    } catch (e) {}

    for (const id of jobIds) {
      console.log(`Polling job: ${id}`);
      let completed = false;
      const jobStart = Date.now();
      for (let i = 0; i < 180; i++) {
        await wait(2000);

        try {
          const data = await page.evaluate(async (url, jwt) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);
            try {
              const r = await fetch(url, {
                headers: { 'Authorization': `Bearer ${jwt}` },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              if (!r.ok) return null;
              return await r.json();
            } catch (e) {
              clearTimeout(timeoutId);
              throw e;
            }
          }, `${BASE_URL}/api/generate-image/uuid/${id}`, jwt);

          if (data?.response?.image_url) {
            const fullUrl = IMAGE_BASE_URL + data.response.image_url;
            urls.push(fullUrl);
            console.log(`Completed ${id}: ${fullUrl}`);
            completed = true;
            timings[`job_${id}_completed`] = Date.now() - jobStart;
            break;
          }

          if (i % 15 === 0 && i > 0) {
            console.log(`... Still generating ${id} (${i * 2}s)`);
          }

        } catch (e) {
          if (e.name === 'AbortError') {
            console.log(`Timeout for ${id}, retrying...`);
            continue;
          }
          console.error(`Poll error for ${id}:`, e.message);
        }
      }

      if (!completed) {
        console.warn(`Job ${id} timed out — check site manually`);
        timings[`job_${id}_timed_out`] = true;
      }
    }

    const outDir = './outputs';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    let saved = 0;
    timings.downloads = [];
    for (let i = 0; i < urls.length; i++) {
      const fname = path.join(outDir, `${runId}_${i + 1}.jpeg`);
      const dlStart = Date.now();
      if (await downloadImage(urls[i], fname)) {
        saved++;
        timings.downloads.push({ url: urls[i], file: fname, ms: Date.now() - dlStart });
      }
    }
    timings.runEnd = Date.now();
    console.log(`\nSUCCESS: ${saved}/${urls.length} images saved in ./outputs`);
    timings.saved = saved;
    timings.urls = urls;
    return { urls, timings, jwt };

  } catch (e) {
    console.error('Generation failed:', e.message);
    return { urls: [], timings: { error: e.message }, jwt };
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', authenticated: !!authContext });
});

app.get('/models', (req, res) => {
  res.json({ models: API_MAPPINGS.MODELS, quality: API_MAPPINGS.QUALITY, aspectRatios: API_MAPPINGS.ASPECT_RATIO });
});

app.post('/auth', async (req, res) => {
  try {
    console.log('Authenticating...');
    authContext = await setupAuthenticatedPage();
    res.json({ success: true, message: 'Authenticated successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt, modelId = 12, qualityId = 1, ratioId = 3 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!authContext) {
      return res.status(401).json({ error: 'Not authenticated. Call /auth first' });
    }

    const model = API_MAPPINGS.MODELS[modelId];
    const quality = API_MAPPINGS.QUALITY[qualityId];
    const aspectRatio = API_MAPPINGS.ASPECT_RATIO[ratioId];

    if (!model || !quality || !aspectRatio) {
      return res.status(400).json({ error: 'Invalid model, quality, or ratio ID' });
    }

    console.log(`API Request: prompt="${prompt}", model=${modelId}, quality=${qualityId}, ratio=${ratioId}`);

    const settings = { prompt, model, quality, aspectRatio };
    const result = await autoGenerate(settings, authContext);

    if (result.jwt) {
      authContext.jwt = result.jwt;
    }

    res.json({
      success: true,
      urls: result.urls,
      timings: result.timings,
      message: `Generated ${result.urls.length} images`
    });
  } catch (e) {
    console.error('Generation error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║     IMGNAI API Server running on port ${PORT}              ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`\n🔗 Endpoints:`);
  console.log(`   GET  /health         - Check server status`);
  console.log(`   GET  /models         - List available models, qualities, ratios`);
  console.log(`   POST /auth           - Authenticate with imgnai.com`);
  console.log(`   POST /generate       - Generate images\n`);
  console.log(`📝 Example request:`);
  console.log(`   curl -X POST http://localhost:${PORT}/generate \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"prompt":"a cat wizard","modelId":12,"qualityId":2,"ratioId":3}'\n`);
});
