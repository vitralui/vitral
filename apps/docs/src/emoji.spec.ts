import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The library draws its pictures with its own icons, never with emojis: an
// emoji looks different on every system, ignores the theme, and is read out
// by name. Specs are left out — they type emojis on purpose, to check the
// editor counts one as one character.

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const scanned = ['packages', 'apps', 'scripts', 'README.md'];
const skipped = new Set(['node_modules', 'dist', '.nuxt', '.output', 'coverage']);
const text = /\.(ts|vue|css|json|md|html|mjs|js)$/;
// Drawn as an emoji by default, or a symbol asked to be one (⚙ + U+FE0F);
// typography such as © and → is not.
const emoji = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

function files(path: string): string[] {
    const full = join(root, path);
    try {
        return readdirSync(full, { withFileTypes: true }).flatMap((entry) =>
            skipped.has(entry.name) || entry.name.startsWith('.') ? [] : entry.isDirectory() ? files(join(path, entry.name)) : text.test(entry.name) ? [join(path, entry.name)] : []
        );
    } catch {
        return text.test(path) ? [path] : [];
    }
}

describe('the sources', () => {
    it('use icons, never emojis', () => {
        const found = scanned
            .flatMap(files)
            .filter((file) => !/\.spec\.ts$/.test(file))
            .flatMap((file) =>
                readFileSync(join(root, file), 'utf8')
                    .split('\n')
                    .map((line, i) => (emoji.test(line) ? `${relative('.', file)}:${i + 1}: ${line.trim().slice(0, 80)}` : null))
                    .filter((hit): hit is string => !!hit)
            );
        expect(found).toEqual([]);
    });
});
