#!/usr/bin/env node
// Writes one HTML file per route of the documentation site, so every page is a
// real URL a crawler can fetch and read. A fragment router would have given
// search engines one page; a path router on a static host gives them a 404
// unless the file is there. This puts the file there.
//
//   node scripts/prerender.mjs [--base /vitral/] [--origin https://vitralui.github.io]
//
// The site is built first, served from a temporary local server, and each route
// is opened in headless Chrome and saved with everything it drew: the theme,
// the component styles and the content. The bundle then takes over in the
// browser as usual. Chrome is found through $CHROME or a Playwright Chromium.
//
// It also writes sitemap.xml and robots.txt, over the same list of routes.

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/docs');
const dist = join(app, 'dist');
const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : fallback;
};
const base = (arg('base', process.env.DOCS_BASE ?? '/') || '/').replace(/\/*$/, '/');
const origin = arg('origin', 'https://vitralui.github.io').replace(/\/$/, '');
const port = Number(arg('port', 4185));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- the routes, from the same files the site reads

const ids = (dir, strip) =>
    readdirSync(join(app, dir))
        .filter((name) => name.endsWith('.vue'))
        .map((name) => strip(name.replace('.vue', '')))
        .sort();

const guides = ids('src/guides', (name) => name.replace(/^\d+-/, ''));
const components = ids('src/demos', (name) => name.toLowerCase());
const templates = readdirSync(join(app, 'src/templates'))
    .filter((name) => existsSync(join(app, 'src/templates', name, 'index.ts')))
    .sort();

const routes = [
    '/',
    '/icons',
    '/templates',
    ...guides.map((id) => `/docs/${id}`),
    ...components.map((id) => `/components/${id}`),
    ...templates.map((id) => `/templates/${id}`)
];

// ---- a server for the built site

const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.woff2': 'font/woff2'
};

const index = readFileSync(join(dist, 'index.html'), 'utf8');

const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = join(dist, path.startsWith(base) ? path.slice(base.length) : path.slice(1));
    if (existsSync(file) && statSync(file).isFile()) {
        response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(response);
        return;
    }
    // Any other path is a route: the application reads it and renders the page.
    response.writeHead(200, { 'content-type': types['.html'] });
    response.end(index);
});

// ---- Chrome, over the DevTools protocol

function findChrome() {
    if (process.env.CHROME) return process.env.CHROME;
    const cache = join(homedir(), '.cache/ms-playwright');
    if (existsSync(cache)) {
        for (const dir of readdirSync(cache).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
            const candidate = join(cache, dir, 'chrome-linux64/chrome');
            if (existsSync(candidate)) return candidate;
        }
    }
    // What a CI runner has installed.
    return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((path) => existsSync(path)) ?? null;
}

async function connect(chrome, debugPort) {
    let targets;
    for (let i = 0; i < 80 && !targets; i++) {
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
    return { send, close: () => socket.close(), chrome };
}

// ---- the same page as text, for whatever reads documentation without a browser

/**
 * Walks the rendered page and writes Markdown: headings, prose, lists, tables
 * (the API tables) and code blocks, with the live examples left out, since
 * their markup is the demo source and that is added from the repository.
 * It runs in the page, where the DOM has already done the assembling.
 */
const readPage = `(${function () {
    const root = document.querySelector('.doc-main') ?? document.querySelector('main') ?? document.body;
    const skip = new Set(['SCRIPT', 'STYLE', 'NAV', 'ASIDE', 'BUTTON', 'NOSCRIPT', 'FORM']);
    const skipClass = ['demo-body', 'demo-tools', 'toc', 'doc-nav', 'home-showcase', 'home-swatches'];
    const ignored = (el) => skip.has(el.tagName) || skipClass.some((name) => el.classList.contains(name));

    const inline = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ');
        if (node.nodeType !== 1 || ignored(node)) return '';
        const inner = Array.from(node.childNodes).map(inline).join('');
        if (node.tagName === 'CODE') return '`' + inner.trim() + '`';
        if (node.tagName === 'A') {
            const href = node.getAttribute('href') ?? '';
            return href.startsWith('#') || !inner.trim() ? inner : '[' + inner.trim() + '](' + node.href + ')';
        }
        if (node.tagName === 'STRONG' || node.tagName === 'B') return '**' + inner.trim() + '**';
        if (node.tagName === 'EM' || node.tagName === 'I') return '*' + inner.trim() + '*';
        if (node.tagName === 'BR') return ' ';
        return inner;
    };

    const out = [];
    const push = (text) => {
        if (text.trim()) out.push(text.trim());
    };

    const cells = (row) => Array.from(row.children).map((cell) => inline(cell).trim().replace(/\|/g, '\\|'));

    const block = (el) => {
        if (ignored(el)) return;
        const tag = el.tagName;
        if (/^H[1-6]$/.test(tag)) return push('#'.repeat(Number(tag[1])) + ' ' + inline(el).trim());
        if (tag === 'P') return push(inline(el));
        if (tag === 'BLOCKQUOTE') return push(inline(el).trim().split('\n').map((line) => '> ' + line).join('\n'));
        if (tag === 'HR') return push('---');
        if (tag === 'UL' || tag === 'OL') {
            const item = (li) => {
                // A card in a list: its heading names it, the rest describes it.
                const heading = li.querySelector('h1, h2, h3, h4, h5, h6');
                if (!heading) return inline(li).trim();
                const rest = Array.from(li.children)
                    .filter((child) => child !== heading)
                    .map(inline)
                    .join(' ')
                    .trim();
                return '**' + inline(heading).trim() + '**' + (rest ? ': ' + rest : '');
            };
            const items = Array.from(el.children).map((li, i) => (tag === 'OL' ? i + 1 + '. ' : '- ') + item(li));
            return push(items.join('\n'));
        }
        if (el.classList.contains('code')) {
            const label = el.querySelector('.code-head span')?.textContent?.trim() ?? '';
            const lang = /\.vue$|^template$/.test(label) ? 'vue' : /\.(ts|js)$|script|^ts$/.test(label) ? 'ts' : /terminal|bash/.test(label) ? 'sh' : /\.css$|^css$/.test(label) ? 'css' : '';
            const code = el.querySelector('pre')?.textContent?.replace(/\n+$/, '') ?? '';
            return push('```' + lang + (label && lang ? ' ' + label : '') + '\n' + code + '\n```');
        }
        if (tag === 'TABLE') {
            const rows = Array.from(el.querySelectorAll('tr')).map(cells).filter((row) => row.length);
            if (!rows.length) return;
            const [head, ...body] = rows;
            return push([('| ' + head.join(' | ') + ' |'), ('| ' + head.map(() => '---').join(' | ') + ' |'), ...body.map((row) => '| ' + row.join(' | ') + ' |')].join('\n'));
        }
        if (tag === 'PRE' || tag === 'IMG' || tag === 'SVG') return;
        Array.from(el.children).forEach(block);
    };

    Array.from(root.children).forEach(block);
    return JSON.stringify({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content ?? '',
        markdown: out.join('\n\n')
    });
}})()`;

const chromePath = findChrome();
if (!chromePath) {
    console.error('No Chrome found ($CHROME, or a Playwright Chromium). Cannot prerender.');
    process.exit(1);
}

server.listen(port);
const browser = spawn(chromePath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${port + 1}`,
    `--user-data-dir=${join(tmpdir(), 'vitral-prerender')}`,
    'about:blank'
]);

try {
    const { send, close } = await connect(browser, port + 1);
    await send('Page.enable');
    await send('Runtime.enable');
    // A fresh visitor sees the light scheme unless their system says otherwise,
    // and the script in the head switches before the first paint.
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

    const started = Date.now();
    const pages = [];
    for (const [i, route] of routes.entries()) {
        const url = `http://localhost:${port}${base}${route === '/' ? '' : route.slice(1) + '/'}`;
        await send('Page.navigate', { url });
        // The page is done when the application has rendered its main element.
        let ready = false;
        for (let tries = 0; tries < 60 && !ready; tries++) {
            await sleep(100);
            const result = await send('Runtime.evaluate', {
                expression: `document.readyState === 'complete' && !!document.querySelector('#app > *')`,
                returnByValue: true
            });
            ready = result?.result?.value === true;
        }
        await sleep(150);
        const html = (await send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true }))?.result?.value;
        if (!html || !ready) throw new Error(`${route} never rendered`);

        const out = route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, `<!doctype html>\n${html}\n`);

        const read = (await send('Runtime.evaluate', { expression: readPage, returnByValue: true }))?.result?.value;
        if (read) pages.push({ route, ...JSON.parse(read) });
        if ((i + 1) % 25 === 0 || i === routes.length - 1) console.log(`  ${i + 1}/${routes.length} pages`);
    }
    console.log(`Prerendered ${routes.length} pages in ${Math.round((Date.now() - started) / 1000)}s.`);
    close();
    writeText(pages);
} finally {
    browser.kill();
    server.close();
}

// ---- what a crawler reads first

const today = new Date().toISOString().slice(0, 10);
const url = (route) => `${origin}${base}${route === '/' ? '' : route.slice(1) + '/'}`;
writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        routes.map((route) => `    <url>\n        <loc>${url(route)}</loc>\n        <lastmod>${today}</lastmod>\n    </url>`).join('\n') +
        `\n</urlset>\n`
);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}sitemap.xml\n`);
console.log('Wrote sitemap.xml and robots.txt.');

// ---- llms.txt

/**
 * Documentation an LLM can read without running a browser, in the shape
 * llmstxt.org describes: `llms.txt` is the index, `llms-full.txt` is the whole
 * thing in one file, and every page also sits beside its HTML as Markdown.
 *
 * A component's page carries its API table, but its examples are behind a
 * button, so the demo file the site runs is appended as the source it is.
 */
function writeText(pages) {
    const url = (route) => `${origin}${base}${route === '/' ? '' : route.slice(1) + '/'}`;
    const asText = (route) => `${origin}${base}${route === '/' ? 'index' : route.slice(1)}.md`;
    const day = new Date().toISOString().slice(0, 10);
    const demoFile = (route) => {
        const id = route.slice('/components/'.length);
        const file = readdirSync(join(app, 'src/demos')).find((name) => name.toLowerCase() === `${id}.vue`);
        return file ? readFileSync(join(app, 'src/demos', file), 'utf8').trim() : null;
    };

    const name = (page) => page.title.split(' · ')[0].replace(/ — .*$/, '');

    for (const page of pages) {
        // The page's own heading is the title, so it is not repeated above it.
        page.markdown = page.markdown.replace(/^# .*\n\n/, '');
        if (page.route.startsWith('/components/')) {
            const demo = demoFile(page.route);
            if (demo) page.markdown += `\n\n## Examples, in full\n\nThe page's examples, as the site runs them.\n\n\`\`\`vue ${page.route.slice(12)}.vue\n${demo}\n\`\`\``;
        }
        page.text = `# ${name(page)}\n\n> ${page.description}\n\nSource: ${url(page.route)}\n\n${page.markdown}\n`;
        const file = page.route === '/' ? join(dist, 'index.md') : join(dist, `${page.route.slice(1)}.md`);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, page.text);
    }

    const of = (prefix) => pages.filter((page) => page.route.startsWith(prefix));
    const entry = (page) => `- [${name(page)}](${asText(page.route)}): ${page.description}`;
    const section = (name, list) => (list.length ? `## ${name}\n\n${list.map(entry).join('\n')}\n` : '');

    const index = [
        '# Vitral',
        '',
        '> A Vue 3 component library built around a token engine: design tokens, presets, light and dark, pass-through attributes and a fully unstyled mode. Nuxt is supported by a module of its own.',
        '',
        'Vitral ships the usual control set plus the pieces applications need and most libraries leave out: charts, a scheduler, a task board, a rich text editor, a command palette and layout panels. Everything that does not need a framework lives in framework-free packages (`@vitral/core`, `@vitral/themes`, `@vitral/styles`, `@vitral/icons`, `@vitral/chart`, `@vitral/forms`), which `@vitral/vue` and `@vitral/nuxt` build on.',
        '',
        'Every page below is also available as Markdown: add `.md` to its URL, without the trailing slash.',
        '',
        section('Guides', of('/docs/')),
        section('Components', of('/components/')),
        section('Templates', of('/templates/')),
        '## Optional\n',
        `- [Everything in one file](${origin}${base}llms-full.txt): every page above, concatenated.`,
        `- [Icons](${origin}${base}icons/): the icon set, searchable on the site.`,
        ''
    ].join('\n');
    writeFileSync(join(dist, 'llms.txt'), index);

    writeFileSync(
        join(dist, 'llms-full.txt'),
        `# Vitral — the whole documentation\n\n> Generated from ${origin}${base} on ${day}.\n\n` + pages.map((page) => page.text).join('\n---\n\n')
    );
    console.log('Wrote llms.txt, llms-full.txt and a .md beside every page.');
}
