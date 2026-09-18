#!/usr/bin/env node
// Writes dist/vitral.css: the shared chrome and every component's stylesheet in
// one file, for apps that would rather link CSS than let components inject it,
// and for a future React or Angular adapter that reads the same styles.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = process.cwd();
const src = join(pkg, 'src');
const parts = [readFileSync(join(src, 'base', 'base.css'), 'utf8')];
for (const dir of readdirSync(src).sort()) {
    if (dir === 'base' || !statSync(join(src, dir)).isDirectory()) continue;
    for (const file of readdirSync(join(src, dir)).filter((f) => f.endsWith('.css'))) parts.push(`/* ${dir} */\n${readFileSync(join(src, dir, file), 'utf8')}`);
}
// The chart's stylesheet lives in `@vitral/chart`, beside its framework-free
// renderer; the bundle still carries it, so one file styles every component.
const chartCss = join(pkg, '..', 'chart', 'src', 'style', 'chart.css');
if (existsSync(chartCss)) parts.push(`/* chart */\n${readFileSync(chartCss, 'utf8')}`);
if (!existsSync(join(pkg, 'dist'))) mkdirSync(join(pkg, 'dist'));
writeFileSync(join(pkg, 'dist', 'vitral.css'), parts.join('\n'));
console.log(`dist/vitral.css: ${parts.length} stylesheets`);
