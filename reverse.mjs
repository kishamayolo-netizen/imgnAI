// reverse.mjs
import * as fs from 'fs';
import * as path from 'path';
import { createInterface } from 'readline/promises';
import { Buffer } from 'buffer';
import { connect } from 'puppeteer-real-browser';

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

const wait = ms => new Promise(r => setTimeout(r, ms));
function getUniquePrefix() { return new Date().toISOString().replace(/[:.]/g, '-'); }

// Debug helpers
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

function msToSec(ms) {
  if (typeof ms !== 'number') return ms;
  return Number((ms / 1000).toFixed(2));
}

function formatTimings(t) {
  if (!t || typeof t !== 'object') return t;
  const out = {};
  const base = t.start || t.runStart || 0;
  for (const k of Object.keys(t)) {
    const v = t[k];
    if (Array.isArray(v)) {
      out[k] = v.map(item => {
        if (item && typeof item === 'object') {
          const copy = { ...item };
          if (copy.ms !== undefined) copy.ms = msToSec(copy.ms) + 's';
          return copy;
        }
        return item;
      });
      continue;
    }
    if (typeof v === 'number') {
      // durations stored as ms (keys like 'total' or job_<id>_completed) or timestamps
      if (k === 'total' || k.endsWith('_completed')) {
        out[k] = msToSec(v) + 's';
      } else if (['runEnd','runStart','sessionEnd','sessionStart','submitStart','submitEnd','browserLaunched','gotoStart','gotoDone','cloudflareStart','cloudflareEnd','waitForUsernameStart','waitForUsernameEnd','fillStart','fillEnd','loginComplete','alreadyLoggedIn'].includes(k)) {
        if (base) out[k] = msToSec(v - base) + 's'; else out[k] = v;
      } else {
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

// AUTO LOGIN
async function setupAuthenticatedPage() {
  const times = {};
  times.start = Date.now();
  console.log('Launching browser...');
  // Always run headless for non-interactive environments.
  const { page, browser } = await connect({
    headless: true,
    turnstile: true,
    userDataDir: PROFILE_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  times.browserLaunched = Date.now();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
  // screenshot right after launch/attach
  await saveDebugScreenshot(page, '01_after_launch.png');

  try {
    // networkidle0 can hang because of persistent connections (analytics, stripe, etc.).
    // Use DOMContentLoaded so we can detect and interact with the login form reliably.
    times.gotoStart = Date.now();
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
    times.gotoDone = Date.now();
    await saveDebugScreenshot(page, '02_login_page.png');
  } catch (e) {
    console.error('Goto login failed:', e.message);
    // capture whatever rendered
    try { await saveDebugScreenshot(page, '02_login_page_error.png'); } catch (e2) {}
    // save main page HTML
    try {
      const dir = './bugScreenshot';
      ensureDir(dir);
      const html = await page.content();
      const htmlPath = path.join(dir, `debug-login-main-${getUniquePrefix()}.html`);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log('Saved page HTML:', htmlPath);
    } catch (e2) {
      console.error('Failed to save main page HTML:', e2.message);
    }
    // save each frame's HTML
    try {
      const frames = page.frames();
      for (let i = 0; i < frames.length; i++) {
        try {
          const f = frames[i];
          const name = f.name() || `frame${i}`;
          const urlSafe = (name || 'frame').replace(/[^a-z0-9-_]/gi, '_').slice(0,40);
          const content = await f.content();
          const fpath = path.join('./bugScreenshot', `debug-frame-${i}-${urlSafe}-${getUniquePrefix()}.html`);
          fs.writeFileSync(fpath, content, 'utf8');
          console.log('Saved frame HTML:', fpath, 'frame.url=', f.url());
        } catch (fe) {
          console.error('Failed to save frame HTML for frame', i, fe.message);
        }
      }
    } catch (e3) {
      console.error('Failed to iterate frames:', e3.message);
    }
    throw e;
  }

  console.log('Bypassing Cloudflare...');
  times.cloudflareStart = Date.now();
  for (let i = 0; i < 30; i++) {
    const challenged = await page.evaluate(() => document.title.includes('Just a moment') || !!document.querySelector('#challenge-form'));
    if (!challenged) break;
    if (i % 3 === 0) {
      // periodic snapshot while waiting
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
        // still navigate to the generate page (lightweight wait)
        await page.goto(GENERATE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
        return { page, browser, jwt: obj.state.token, timings: times };
      }
    } catch {}
  }

  console.log('Logging in...');
  // Give the page more time to hydrate and render dynamic inputs.
  try {
    times.waitForUsernameStart = Date.now();
    await page.waitForSelector('input[name="username"]', { timeout: 60000 });
    times.waitForUsernameEnd = Date.now();
  } catch (err) {
    console.warn('Username input did not appear in main document within 60s; will search frames as a fallback');
    times.waitForUsernameEnd = Date.now();
  }

  // Try to type into main document first. If that fails, try to find inputs inside frames and set values directly.
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
    // Search frames for inputs and set values directly
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
            // Dispatch input events so React/Vue can pick up the change
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

// GENERATE
async function autoGenerate(settings, context) {
  const runId = getUniquePrefix();
  const { page, browser, jwt: initialJwt } = context;
  let jwt = initialJwt;
  const timings = { runStart: Date.now() };

  try {
    // === CREATE SESSION ===
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
    await saveDebugScreenshot(page, '10_after_create_session.png');

    // === BUILD BATCH ===
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

    // === SUBMIT BATCH ===
    timings.submitStart = Date.now();
    // Log the payload locally so we can inspect what 'profile' value is being sent.
    try {
      console.log('Batch payload:', JSON.stringify(payload, null, 2));
    } catch (e) {}

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
      // On batch failure, attempt to fetch available profiles to help debug 'no-profile' errors.
      console.error('Batch submission error:', err.message || err);
      try {
        const profiles = await page.evaluate(async (url, jwt) => {
          try {
            const r = await fetch(url, { headers: { 'Authorization': `Bearer ${jwt}` } });
            const txt = await r.text();
            try { return JSON.parse(txt); } catch (e) { return { raw: txt, status: r.status }; }
          } catch (e) {
            return { error: e.message };
          }
        }, `${BASE_URL}/api/profiles`, jwt);
        console.log('Profiles endpoint response:', profiles);
      } catch (e2) {
        console.error('Failed to fetch profiles endpoint:', e2.message || e2);
      }
      // rethrow so outer catch/handler deals with it the same as before
      throw err;
    }
    timings.submitEnd = Date.now();
    console.log(`Started ${jobIds.length} jobs`);
    await saveDebugScreenshot(page, '11_after_submit_batch.png');

    // === POLL: CHECK FOR response.image_url ===
    const urls = [];
    // Wait a short initial delay before polling so the backend has time to kick off work.
    // Fast quality: wait ~10s. High Quality: wait ~20s. This reduces needless early polls.
    try {
      const initialDelayMs = settings.quality && settings.quality.value ? 10000 : 20000;
      console.log(`Waiting ${initialDelayMs / 1000}s before polling (quality: ${settings.quality?.name})`);
      timings.pollInitialDelay = initialDelayMs;
      await wait(initialDelayMs);
    } catch (e) {
      // non-fatal
    }
    for (const id of jobIds) {
      console.log(`Polling job: ${id}`);
      let completed = false;
      const jobStart = Date.now();
      for (let i = 0; i < 180; i++) {
        await wait(2000); // Every 2 seconds

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

          // FIXED: Check for image_url in response
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

    // === DOWNLOAD ===
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

// INPUT
async function getUserInput() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nIMGNAI AUTO-GENERATOR\n');
  const prompt = (await rl.question('Prompt (or type exit to quit): ')) || 'a magical cat wizard';
  if (prompt.trim().toLowerCase() === 'exit') {
    rl.close();
    return { exit: true };
  }
  let model, quality, ratio;
  while (!model) { console.log('\nModels:'); Object.keys(API_MAPPINGS.MODELS).forEach(k => console.log(` ${k}. ${API_MAPPINGS.MODELS[k].name}`)); model = API_MAPPINGS.MODELS[parseInt(await rl.question('Model #: '), 10)]; }
  while (!quality) { console.log('\nQuality:'); Object.keys(API_MAPPINGS.QUALITY).forEach(k => console.log(` ${k}. ${API_MAPPINGS.QUALITY[k].name}`)); quality = API_MAPPINGS.QUALITY[parseInt(await rl.question('Quality #: '), 10)]; }
  while (!ratio) { console.log('\nRatio:'); Object.keys(API_MAPPINGS.ASPECT_RATIO).forEach(k => console.log(` ${k}. ${API_MAPPINGS.ASPECT_RATIO[k].name}`)); ratio = API_MAPPINGS.ASPECT_RATIO[parseInt(await rl.question('Ratio #: '), 10)]; }
  rl.close();
  return { prompt, model, quality, aspectRatio: ratio };
}

// RUN
// RUN: keep browser open between runs; only close when user types 'exit'
(async () => {
  try {
    console.log('Setting up authenticated browser session...');
    let setup = await setupAuthenticatedPage();
    let { page, browser, jwt, timings: setupTimings } = setup;
    console.log('Authenticated. timings:', setupTimings || {});

    while (true) {
      const settings = await getUserInput();
      if (settings?.exit) {
        console.log('Exit requested — closing browser and exiting.');
        try { await browser.close(); } catch (e) {}
        process.exit(0);
      }

      const result = await autoGenerate(settings, { page, browser, jwt });
      if (result?.jwt) jwt = result.jwt;
      console.log('Generation timings:', result.timings || {});
      console.log('\nReady for next prompt (or type exit).');
    }

  } catch (e) {
    console.error('Startup failed:', e);
    process.exit(1);
  }
})();