import { en, ptBR, type Locale } from '@vitral/core';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountVt } from '../test/utils';
import Carousel from './components/Carousel/Carousel.vue';
import Kbd from './components/Kbd/Kbd.vue';

// Every word a component says comes from the locale, so an application that
// sets one gets all of them in its language. Nothing fails when a component
// writes a word of its own instead — it is simply left in English — so this
// is where that is caught.

const here = dirname(fileURLToPath(import.meta.url));

function vueFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? vueFiles(join(dir, entry.name)) : entry.name.endsWith('.vue') ? [join(dir, entry.name)] : []));
}

/** What a reader sees or a screen reader says, given as a literal in a template. */
const spoken = /(?:^|\s)(aria-label|aria-description|aria-roledescription|aria-valuetext|title|placeholder|alt|label)="([^"{]*[A-Za-z]{2,}[^"]*)"/;
// Not words: the start of an address, which is the same in every language.
const allowed = new Set(['https://']);

describe('the words of the components', () => {
    it('are never written into a template: not as an attribute, not as text', () => {
        const found: string[] = [];
        for (const file of vueFiles(join(here, 'components'))) {
            const source = readFileSync(file, 'utf8');
            const start = source.indexOf('<template>');
            if (start < 0) continue;
            const template = source.slice(start).replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
            const line = (index: number) => source.slice(0, start + index).split('\n').length;
            template.split('\n').forEach((text, i) => {
                const attribute = spoken.exec(text);
                if (attribute && !allowed.has(attribute[2]!)) found.push(`${relative(here, file)}:${source.slice(0, start).split('\n').length + i}: ${attribute[1]}="${attribute[2]}"`);
            });
            // Text between tags, outside an interpolation.
            for (const match of template.matchAll(/>([^<>]+)</g)) {
                const text = match[1]!.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
                // A piece of an expression that holds a `>` is not text; words are letters with spaces around them.
                if (/^[A-Za-z][A-Za-z ]{2,}$/.test(text)) found.push(`${relative(here, file)}:${line(match.index!)}: ${text}`);
            }
        }
        expect(found).toEqual([]);
    });

    it('are all there in every locale: no group or word of the English one is missing from another', () => {
        const shape = (value: unknown, path: string): string[] =>
            Array.isArray(value) ? [`${path}[${value.length}]`] : value && typeof value === 'object' ? Object.entries(value).flatMap(([key, inner]) => shape(inner, path ? `${path}.${key}` : key)) : [path];
        expect(shape(ptBR, '')).toEqual(shape(en, ''));
        // And none of them is empty.
        const empty = (value: unknown, path: string): string[] =>
            typeof value === 'string' ? (value.trim() ? [] : [path]) : value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).flatMap(([key, inner]) => empty(inner, `${path}.${key}`)) : [];
        expect(empty(ptBR, 'ptBR')).toEqual([]);
    });

    it('reach what a screen reader is told a thing is, and what a key is called', () => {
        const locale: Locale = ptBR;
        const carousel = mountVt(
            defineComponent(() => () => h(Carousel, { value: [1, 2, 3], ariaLabel: 'Fotos' }, { item: ({ item }: { item: number }) => h('div', String(item)) })),
            {},
            { theme: 'none', locale }
        );
        expect(carousel.get('section').attributes('aria-roledescription')).toBe('carrossel');
        expect(carousel.find('[aria-roledescription="slide"]').exists()).toBe(true);
        expect(carousel.find('[aria-roledescription="carousel"]').exists()).toBe(false);

        const keys = mountVt(Kbd, { props: { keys: 'shift+space', platform: 'other' } }, { theme: 'none', locale });
        expect(keys.findAll('kbd.vt-kbd-key').map((k) => k.text())).toEqual(['Shift', 'Espaço']);
        const arrow = mountVt(Kbd, { props: { keys: 'up', platform: 'other' } }, { theme: 'none', locale });
        expect(arrow.get('[aria-hidden="true"]').text()).toBe('↑');
        expect(arrow.get('.vt-sr-only').text()).toBe('Seta para cima');
    });
});
