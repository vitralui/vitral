#!/usr/bin/env node
// Photographs every screen of every template — the whole page, top to bottom —
// in light and dark, for the documentation site. The dev server must be running.
//
//   node scripts/shoot-templates.mjs [--url http://localhost:5180] [--only ecommerce,saas]
//
// Chrome is found through $CHROME, or the Chromium Playwright installs. Each
// shot is the template's full-screen route with `?shot` (no floating bar),
// in the default preset, written to apps/docs/public/templates/<id>/<screen>-<scheme>.webp.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = join(root, 'apps/docs/src/templates');
const outDir = join(root, 'apps/docs/public/templates');
const WIDTH = 1440;
const HEIGHT = 900;
/** A page longer than this is cut: the pictures are for looking at, not archiving. */
const MAX_HEIGHT = 5200;
const PORT = 9345;

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg('url', 'http://localhost:5180');
const only = arg('only', '')?.split(',').filter(Boolean);

function findChrome() {
    if (process.env.CHROME) return process.env.CHROME;
    const cache = join(homedir(), '.cache/ms-playwright');
    if (existsSync(cache)) {
        for (const dir of readdirSync(cache).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
            const candidate = join(cache, dir, 'chrome-linux64/chrome');
            if (existsSync(candidate)) return candidate;
        }
    }
    throw new Error('No Chrome found: set $CHROME.');
}

// The screens, read from each template's screens.ts: `{ id: 'home', name: …`.
const templates = readdirSync(templatesDir)
    .filter((d) => existsSync(join(templatesDir, d, 'screens.ts')))
    .filter((d) => !only?.length || only.includes(d))
    .map((id) => ({ id, screens: [...readFileSync(join(templatesDir, id, 'screens.ts'), 'utf8').matchAll(/\{\s*id: '([\w-]+)'/g)].map((m) => m[1]) }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn(findChrome(), ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--password-store=basic', '--use-mock-keychain', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), 'vitral-shots')}`, 'about:blank']);

try {
    let targets;
    for (let i = 0; i < 50 && !targets; i++) {
        try {
            targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        } catch {
            await sleep(200);
        }
    }
    const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve) => (ws.onopen = resolve));
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        pending.get(message.id)?.(message);
        pending.delete(message.id);
    };
    const send = (method, params = {}) =>
        new Promise((resolve) => {
            const id = ++seq;
            pending.set(id, resolve);
            ws.send(JSON.stringify({ id, method, params }));
        });

    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    let count = 0;
    for (const { id, screens } of templates) {
        mkdirSync(join(outDir, id), { recursive: true });
        for (const screen of screens) {
            for (const scheme of ['light', 'dark']) {
                // A dev server reloading mid-shot can drop a capture: try again.
                let data;
                for (let attempt = 0; attempt < 3 && !data; attempt++) {
                    await send('Page.navigate', { url: `${base}/?scheme=${scheme}&preset=prism&shot#/templates/${id}/preview/${screen}` });
                    // Async screens, fonts and photos.
                    await sleep(2500 + attempt * 1500);
                    await send('Runtime.evaluate', {
                        expression: 'Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 4000); })))',
                        awaitPromise: true
                    });
                    await sleep(300);
                    // The window is made as tall as the page, so what is sized to it —
                    // an app's sticky sidebar — runs the whole length of the picture.
                    const measure = async () =>
                        (await send('Runtime.evaluate', { expression: 'Math.ceil(document.documentElement.scrollHeight)', returnByValue: true })).result?.result?.value ?? HEIGHT;
                    let height = Math.min(MAX_HEIGHT, await measure());
                    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height, deviceScaleFactor: 1, mobile: false });
                    await sleep(500);
                    height = Math.min(MAX_HEIGHT, await measure());
                    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height, deviceScaleFactor: 1, mobile: false });
                    await sleep(300);
                    data = (await send('Page.captureScreenshot', { format: 'webp', quality: 80, clip: { x: 0, y: 0, width: WIDTH, height, scale: 1 } })).result?.data;
                    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
                }
                if (!data) throw new Error(`No picture of ${id}/${screen} (${scheme}).`);
                writeFileSync(join(outDir, id, `${screen}-${scheme}.webp`), Buffer.from(data, 'base64'));
                count++;
            }
        }
        console.log(`${id}: ${screens.length} screens`);
    }
    console.log(`${count} shots in ${outDir}`);
    ws.close();
} finally {
    chrome.kill('SIGKILL');
}
