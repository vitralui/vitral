import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { categories as iconCategories } from '@vitral/icons/registry';
import { addons } from './lib/addons';
import { apiOf } from './lib/api';
import { chartEntries, families } from './lib/charts';
import { entries } from './lib/catalog';
import { guides } from './lib/guides';
import { themes } from './lib/presets';
import { directionOptions, swatches } from './lib/theme';
import { sectionSources } from './lib/source';
import { templates } from './templates';

/**
 * Every language other than English is JSON under `src/locales/<lang>/`, and
 * nothing fails at runtime when a string is missing: the English is shown
 * instead. So this is where a missing translation is caught — every string the
 * site says in English has to have one, in every language there is.
 */
const src = dirname(fileURLToPath(import.meta.url));
const locales = join(src, 'locales');
const languages = readdirSync(locales, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

type Json = Record<string, unknown>;
const read = (which: string, name: string): Json | undefined => {
    try {
        return JSON.parse(readFileSync(join(locales, which, `${name}.json`), 'utf8')) as Json;
    } catch {
        return undefined;
    }
};
const at = (json: Json | undefined, key: string): unknown => key.split('.').reduce<unknown>((value, part) => (value as Json | undefined)?.[part], json);

function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : /\.(vue|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [join(dir, entry.name)] : []
    );
}

// The site's own code: not the demos (their words are in `components/`) and
// not the templates' applications (sample apps, in English on every page).
const siteFiles = files(src).filter((file) => !file.includes('/demos/') && !/\/templates\/[^/]+\//.test(file) && !file.includes('/locales/'));

/** Every `t('…')` with a literal key, in the site's own code. */
const literalKeys = [
    ...new Set(
        siteFiles.flatMap((file) =>
            [...readFileSync(file, 'utf8').matchAll(/\bt\(\s*(?:'((?:\\'|[^'])*)'|"([^"]*)")/g)].map((match) => (match[1] ?? match[2]!).replace(/\\'/g, "'"))
        )
    )
];

/** The keys that reach `t()` as data: menu labels, category names, the notes beside them. */
const dataKeys = [
    ...addons.flatMap((addon) => [addon.title, addon.note]),
    ...families,
    ...new Set(templates.map((entry) => entry.category)),
    ...directionOptions.map((option) => option.label),
    ...swatches.map((swatch) => swatch.name),
    ...iconCategories.map((category) => category.label),
    // The notes beside the menu's categories and guide sections; not its icon names.
    ...[...readFileSync(join(src, 'parts/MegaMenu.vue'), 'utf8').matchAll(/const (?:categoryNotes|guideNotes)\b[^{]*\{([^}]*)\}/g)].flatMap((block) =>
        [...block[1]!.matchAll(/^\s+(?:'[^']+'|\w+): '([^']+)',?$/gm)].map((match) => match[1]!)
    )
];

/** Every `<T k="…">` in a file. */
const proseKeys = (file: string) => [...readFileSync(file, 'utf8').matchAll(/<T\b[^>]*\bk="([^"]+)"/g)].map((match) => match[1]!);

describe.each(languages)('the %s translation', (which) => {
    const missing = (list: string[]) => expect(list, `${list.length} missing`).toEqual([]);

    it("has every one of the site's own strings", () => {
        const ui = read(which, 'ui');
        missing([...literalKeys, ...dataKeys].filter((key) => typeof ui?.[key] !== 'string'));
    });

    it('has the prose outside the guides', () => {
        const need: [string, string][] = [
            ...['pages/ComponentPage.vue', 'pages/Home.vue', 'pages/IconsPage.vue'].flatMap((file) => proseKeys(join(src, file)).map((key) => ['ui', key] as [string, string])),
            ...proseKeys(join(src, 'pages/ChartsPage.vue')).map((key) => ['charts', key] as [string, string])
        ];
        missing(need.filter(([name, key]) => typeof at(read(which, name), key) !== 'string').map(([name, key]) => `${name}: ${key}`));
    });

    it('has every guide, whole', () => {
        const gaps = guides.flatMap((guide) => {
            const file = readdirSync(join(src, 'guides')).find((name) => name.replace(/^\d+-/, '') === `${guide.id}.vue`)!;
            const json = read(which, `guides/${guide.id}`);
            return ['title', 'description', ...proseKeys(join(src, 'guides', file))].filter((key) => typeof at(json, key) !== 'string').map((key) => `${guide.id}: ${key}`);
        });
        missing(gaps);
    });

    it('has every component page, section by section', () => {
        const gaps = entries.flatMap((entry) => {
            const json = read(which, `components/${entry.id}`);
            const sections = (json?.sections ?? {}) as Record<string, { title?: string; description?: string }>;
            const source = readFileSync(join(src, 'demos', `${entry.file}.vue`), 'utf8');
            const described = new Set([...source.matchAll(/<DemoSection\b(?:"[^"]*"|[^>"])*?\btitle="([^"]*)"(?:"[^"]*"|[^>"])*?(?<!:)\bdescription="/g)].map((match) => match[1]!));
            return [
                ...(entry.meta.description && typeof json?.description !== 'string' ? ['description'] : []),
                ...[...sectionSources(entry.file).keys()].flatMap((title) => [
                    // A title may stay in English — one that names a chart type, say —
                    // but the section must have been looked at.
                    ...(typeof sections[title] !== 'object' ? [`sections.${title}`] : []),
                    ...(described.has(title) && typeof sections[title]?.description !== 'string' ? [`sections.${title}.description`] : [])
                ])
            ].map((key) => `${entry.id}: ${key}`);
        });
        missing(gaps);
    });

    it('has every template, with lists as long as the English', () => {
        const gaps = templates.flatMap((entry) => {
            const json = read(which, `templates/${entry.id}`) as Json | undefined;
            const list = (key: 'tags' | 'features' | 'faq') => (Array.isArray(json?.[key]) && (json![key] as unknown[]).length === entry[key].length ? [] : [key]);
            const screens = entry.screens.filter((screen) => typeof at(json, `screens.${screen.id}.name`) !== 'string' || typeof at(json, `screens.${screen.id}.summary`) !== 'string');
            return [
                ...['summary', 'description'].filter((key) => typeof json?.[key] !== 'string'),
                ...list('tags'),
                ...list('features'),
                ...list('faq'),
                ...screens.map((screen) => `screens.${screen.id}`)
            ].map((key) => `${entry.id}: ${key}`);
        });
        missing(gaps);
    });

    it('has every preset, with traits as many as the English', () => {
        const json = read(which, 'presets');
        missing(
            themes.flatMap((theme) => [
                ...['origin', 'description'].filter((key) => typeof at(json, `${theme.id}.${key}`) !== 'string').map((key) => `${theme.id}.${key}`),
                ...((at(json, `${theme.id}.traits`) as unknown[] | undefined)?.length === theme.traits.length ? [] : [`${theme.id}.traits`])
            ])
        );
    });

    it('has every documented prop, event and slot', () => {
        const gaps = entries.flatMap((entry) => {
            const api = apiOf(entry.file);
            if (!api) return [];
            const json = read(which, `api/${entry.id}`);
            return (['props', 'emits', 'slots'] as const).flatMap((kind) =>
                api[kind].filter((member) => member.doc && typeof at(json, `${kind}.${member.name}`) !== 'string').map((member) => `${entry.id}: ${kind}.${member.name}`)
            );
        });
        missing(gaps);
    });

    it('has every chart in the gallery', () => {
        const json = read(which, 'charts');
        missing(chartEntries.flatMap((entry) => ['note'].filter((key) => typeof at(json, `charts.${entry.id}.${key}`) !== 'string').map((key) => `${entry.id}.${key}`)));
    });
});
