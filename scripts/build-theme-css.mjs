#!/usr/bin/env node
// Writes each shipped preset as a plain stylesheet (dist/css/<preset>.css), so
// a page can be themed with a <link> and no JavaScript at all.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const pkg = process.cwd();
const themes = await import(pathToFileURL(join(pkg, 'dist', 'index.js')).href);
mkdirSync(join(pkg, 'dist', 'css'), { recursive: true });
for (const name of ['Prism', 'Ink', 'Avalonia', 'Simple']) {
    const file = join(pkg, 'dist', 'css', `${name.toLowerCase()}.css`);
    writeFileSync(file, themes.compileTheme(themes[name]).css);
    console.log(`dist/css/${name.toLowerCase()}.css`);
}
