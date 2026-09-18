#!/usr/bin/env node
// Runs the Nuxt playground and checks the things only a running app can show:
// that the page is styled before the bundle loads, that the scheme in the
// cookie is the one the server renders, and that nothing warns when it
// hydrates. A hydration mismatch is a dev-only warning in the browser console
// and nowhere else, which is why this opens a browser to read it.
//
//   node scripts/check-nuxt.mjs [--port 3125] [--no-browser] [--keep]
//
// Chrome is found through $CHROME or the Chromium Playwright installs; without
// one the browser checks are skipped and the rest still run.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/nuxt-playground');
const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : fallback;
};
const port = Number(arg('port', 3125));
const base = `http://localhost:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;
function check(name, ok, detail) {
    console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${ok || !detail ? '' : `\n        ${detail}`}`);
    if (!ok) failures++;
}

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
    });
}

// The playground reads the packages' dist, like any app would.
if (!existsSync(join(root, 'packages/nuxt/dist/module.js')) || !existsSync(join(root, 'packages/vue/dist/index.js'))) {
    console.log('Building the packages first…');
    await run('pnpm', ['-w', 'run', 'build'], { cwd: root });
}

console.log(`Starting the playground on ${base}…`);
const log = [];
const server = spawn('npx', ['nuxt', 'dev', '--port', String(port)], { cwd: app, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.on('data', (chunk) => log.push(String(chunk)));
server.stderr.on('data', (chunk) => log.push(String(chunk)));

const stop = () => {
    if (!process.argv.includes('--keep')) server.kill('SIGTERM');
};
process.on('exit', stop);
process.on('SIGINT', () => process.exit(130));

const get = async (cookie) => {
    const response = await fetch(base, { headers: cookie ? { cookie } : {} });
    return response.text();
};

let html;
for (let i = 0; i < 120 && html === undefined; i++) {
    try {
        html = await get();
    } catch {
        await sleep(1000);
    }
}
if (html === undefined) {
    console.error('The playground never answered:\n' + log.join(''));
    process.exit(1);
}

console.log('\nThe HTML the server sends');
check('the theme is in the head', html.includes('data-vitral-theme'));
check('so is every component that rendered', ['base', 'button', 'inputtext', 'select', 'form'].every((name) => html.includes(`data-vitral-style="${name}"`)));
check('the components rendered as markup', html.includes('vt-button') && html.includes('vt-inputtext'));
check('the chart rendered its empty host', /<div[^>]*class="[^"]*"[^>]*><\/div>|<div><\/div>/.test(html));

console.log('\nThe colour scheme');
const dark = await get('vitral-scheme=dark');
const light = await get('vitral-scheme=light');
check('a remembered dark scheme is on <html>', /<html[^>]*class="[^"]*vt-dark/.test(dark));
check('and needs no script to correct it', !dark.includes('prefers-color-scheme: dark'));
check('a remembered light scheme marks nothing', !/<html[^>]*vt-dark/.test(light) && !light.includes('prefers-color-scheme: dark'));
check('with nothing remembered, the script decides', html.includes('prefers-color-scheme: dark') && html.includes('classList.toggle("vt-dark"'));

if (!process.argv.includes('--no-browser')) await browserChecks();

console.log('\nThe server log');
const output = log.join('');
check('no error while the app started', !output.includes('Error caught during app initialization'), output.slice(-600));
check('no hydration mismatch', !/hydration|mismatch/i.test(output), output.slice(-600));

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);

// ---- the browser

function findChrome() {
    if (process.env.CHROME) return process.env.CHROME;
    const cache = join(homedir(), '.cache/ms-playwright');
    if (!existsSync(cache)) return null;
    for (const dir of readdirSync(cache).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
        const candidate = join(cache, dir, 'chrome-linux64/chrome');
        if (existsSync(candidate)) return candidate;
    }
    return null;
}

async function browserChecks() {
    const chrome = findChrome();
    if (!chrome) {
        console.log('\nNo Chrome found ($CHROME, or a Playwright Chromium): skipping the browser checks.');
        return;
    }

    const debugPort = port + 1000;
    const browser = spawn(chrome, [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${join(tmpdir(), 'vitral-check-nuxt')}`,
        'about:blank'
    ]);

    try {
        let targets;
        for (let i = 0; i < 60 && !targets; i++) {
            try {
                targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
            } catch {
                await sleep(200);
            }
        }
        const page = targets?.find((target) => target.type === 'page');
        if (!page) throw new Error('Chrome never opened a page.');

        const socket = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = reject;
        });

        let id = 0;
        const pending = new Map();
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && pending.has(data.id)) pending.get(data.id)(data.result);
        };
        const send = (method, params = {}) =>
            new Promise((resolve) => {
                const n = ++id;
                pending.set(n, resolve);
                socket.send(JSON.stringify({ id: n, method, params }));
            });
        const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.value;

        await send('Runtime.enable');
        await send('Page.enable');
        // Keep everything the page complains about, so it can be read back.
        await send('Page.addScriptToEvaluateOnNewDocument', {
            source: `window.__said = [];
                const keep = (what) => window.__said.push(String((what && what.stack) || what));
                addEventListener('error', (event) => keep(event.error ?? event.message));
                addEventListener('unhandledrejection', (event) => keep(event.reason));
                for (const level of ['error', 'warn']) {
                    const original = console[level];
                    console[level] = (...args) => { args.forEach(keep); original(...args); };
                }`
        });
        await send('Page.navigate', { url: base + '/' });
        await sleep(6000);

        const said = JSON.parse((await evaluate('JSON.stringify(window.__said)')) ?? '[]');
        const state = JSON.parse(
            (await evaluate(`JSON.stringify({
                styles: document.querySelectorAll('style[data-vitral-style]').length,
                theme: document.querySelectorAll('style[data-vitral-theme]').length,
                buttons: document.querySelectorAll('.vt-button').length,
                chart: document.querySelectorAll('.vt-chart svg').length
            })`)) ?? '{}'
        );

        console.log('\nIn the browser');
        check('the page hydrated without a warning', said.length === 0, said.join('\n        '));
        check('one theme and every stylesheet, injected once', state.theme === 1 && state.styles >= 5, JSON.stringify(state));
        check('the components are mounted', state.buttons > 0, JSON.stringify(state));
        check('the chart drew itself after hydration', state.chart > 0, JSON.stringify(state));

        await evaluate(`document.querySelector('header .vt-button').click()`);
        await sleep(400);
        const after = JSON.parse((await evaluate(`JSON.stringify({ html: document.documentElement.className, cookie: document.cookie })`)) ?? '{}');
        check('switching the scheme writes the cookie', /vitral-scheme=(light|dark)/.test(after.cookie ?? ''), JSON.stringify(after));

        socket.close();
    } finally {
        browser.kill();
    }
}
