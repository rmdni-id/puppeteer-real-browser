import test from 'node:test';
import assert from 'node:assert';
import { connect } from '../../lib/esm/index.mjs';

const realBrowserOption = {
    args: ["--start-maximized"],
    turnstile: false,
    headless: false,
    customConfig: {},
    connectOption: { defaultViewport: null },
    plugins: []
}

async function withPage(fn, options = {}) {
    const { page, browser } = await connect({ ...realBrowserOption, ...options });
    try {
        return await fn(page);
    } finally {
        await browser.close().catch(() => {});
    }
}

test('Rebrowser Bot Detector', async () => {
    await withPage(async (page) => {
        await page.goto('https://bot-detector.rebrowser.net/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => {
            const el = document.querySelector('#detections-json');
            if (!el || !el.value) return false;
            try {
                return JSON.parse(el.value).some(d => d.type === 'useragent' && d.rating !== 0);
            } catch {
                return false;
            }
        }, { timeout: 45000, polling: 500 });
        const detections = await page.evaluate(() => JSON.parse(document.querySelector('#detections-json').value));
        const byType = Object.fromEntries(detections.map(d => [d.type, d.rating]));
        assert.strictEqual(byType.navigatorWebdriver, -1, 'navigator.webdriver is set - bot detected');
        assert.strictEqual(byType.runtimeEnableLeak, -1, 'Runtime.enable leak detected');
        const failed = detections.filter(d => d.rating > 0);
        assert.strictEqual(failed.length, 0, `Rebrowser detector flagged the browser: ${JSON.stringify(failed)}`);
    });
});

test('SannySoft WebDriver Detector', async () => {
    await withPage(async (page) => {
        await page.goto('https://bot.sannysoft.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => document.body.innerText.includes('WebDriver'), { timeout: 45000, polling: 500 });
        const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
        assert.ok(body.includes('WebDriver (New) missing (passed)'), 'WebDriver property leaked');
        assert.ok(body.includes('WebDriver Advanced passed'), 'WebDriver Advanced check failed');
        assert.ok(body.includes('Chrome (New) present (passed)'), 'Chrome runtime check failed');
    });
});

test('BrowserScan Bot Detection', async () => {
    await withPage(async (page) => {
        await page.goto('https://www.browserscan.net/bot-detection', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForFunction(() => document.body.innerText.includes('Test Results'), { timeout: 45000, polling: 500 });
        const results = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.slice(text.indexOf('Test Results'), text.indexOf('Test Results') + 200);
        });
        assert.match(results, /Test Results:\s*Normal/, 'BrowserScan flagged the browser');
    });
});

test('Cloudflare WAF', async () => {
    await withPage(async (page) => {
        await page.goto('https://nowsecure.nl', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => document.body.innerText.includes('NOWSECURE'), { timeout: 45000, polling: 500 });
        const body = await page.evaluate(() => document.body.innerText);
        assert.ok(body.includes('NOWSECURE'), 'Cloudflare challenge did not resolve to content');
        assert.ok(!/just a moment|attention required|checking your browser/i.test(body), 'Cloudflare challenge intercepted the request');
    });
});

test('Cloudflare Turnstile', async () => {
    await withPage(async (page) => {
        await page.goto('https://browser-compat.turnstile.workers.dev/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => document.body.innerText.includes('ALL CLEAR') || document.body.innerText.includes('Diagnostics passed'), { timeout: 90000, polling: 500 });
        const body = await page.evaluate(() => document.body.innerText);
        assert.ok(/ALL CLEAR|Diagnostics passed/.test(body), 'Turnstile did not pass');
    }, { turnstile: true });
});

test('reCAPTCHA v3 Score', async () => {
    await withPage(async (page) => {
        await page.goto('https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.goto('https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php', { waitUntil: 'networkidle2', timeout: 60000 });
        const deadline = Date.now() + 60000;
        let raw = null;
        while (Date.now() < deadline) {
            raw = await page.evaluate(() => {
                const pre = [...document.querySelectorAll('pre')].find(p => /"score"\s*:\s*[0-9.]+/.test(p.textContent));
                return pre ? pre.textContent : null;
            });
            if (raw) break;
            await new Promise(r => setTimeout(r, 2000));
        }
        assert.ok(raw, 'reCAPTCHA v3 score never appeared');
        const score = parseFloat(JSON.parse(raw).score);
        assert.ok(score >= 0.7, `reCAPTCHA v3 score too low: ${score}`);
    });
});