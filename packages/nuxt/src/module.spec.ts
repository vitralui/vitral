import * as vitral from '@vitral/vue';
import { componentNames, composableNames } from '@vitral/vue/manifest';
import { describe, expect, it } from 'vitest';
import { componentRegistrations, defaults, optionsTemplate } from './options';

/** The options object out of the generated module, since its imports cannot be resolved here. */
function runtimeOptions(template: string): Record<string, unknown> {
    const literal = /export const options = ([\s\S]*?);\n/.exec(template)?.[1];
    return JSON.parse(literal ?? 'null');
}

describe('the generated options module', () => {
    it('imports a shipped preset and locale by name', () => {
        const template = optionsTemplate(defaults);
        expect(template).toContain("import { Ink as preset, en as locale } from '@vitral/vue';");
        expect(template).toContain('export { preset, locale };');
        expect(runtimeOptions(template)).toEqual({
            colorScheme: 'system',
            cookie: 'vitral-scheme',
            darkModeSelector: '.vt-dark',
            cssLayer: false,
            inputVariant: 'outlined',
            direction: 'ltr',
            unstyled: false
        });
    });

    it('puts the directives in the module, for the plugin to register', () => {
        const template = optionsTemplate(defaults, ['Tooltip']);
        expect(template).toContain("import { Ink as preset, en as locale, Tooltip } from '@vitral/vue';");
        expect(template).toContain('export const directives = { tooltip: Tooltip };');
        expect(optionsTemplate(defaults)).toContain('export const directives = {};');
    });

    it('treats anything else as a module that default-exports one', () => {
        const template = optionsTemplate({ ...defaults, preset: '~/theme/brand', locale: '~/locale/fr' });
        expect(template).toContain('import preset from "~/theme/brand";');
        expect(template).toContain('import locale from "~/locale/fr";');
        expect(template).not.toContain('@vitral/vue');
    });

    it('leaves preset and locale null when there are none', () => {
        const template = optionsTemplate({ ...defaults, preset: false, locale: false });
        expect(template).toContain('const preset = null;');
        expect(template).toContain('const locale = null;');
    });

    it('passes through the scheme and cookie from the config', () => {
        const template = optionsTemplate({ ...defaults, colorScheme: 'dark', cookie: false, cssLayer: 'vitral' });
        expect(runtimeOptions(template)).toMatchObject({ colorScheme: 'dark', cookie: false, cssLayer: 'vitral' });
    });
});

describe('component registration', () => {
    it('applies the configured prefix', () => {
        const registered = componentRegistrations(['Button', 'InputText'], 'Vt');
        expect(registered).toEqual([
            { name: 'VtButton', export: 'Button', filePath: '@vitral/vue' },
            { name: 'VtInputText', export: 'InputText', filePath: '@vitral/vue' }
        ]);
        expect(componentRegistrations(['Button'], '')[0]!.name).toBe('Button');
    });
});

describe('the manifest', () => {
    const isComponent = (value: unknown): boolean =>
        (typeof value === 'object' || typeof value === 'function') && value !== null && ('render' in value || 'setup' in value || '__name' in value);

    it('lists every component the package exports and nothing else', () => {
        const exported = Object.entries(vitral)
            .filter(([, value]) => isComponent(value))
            .map(([name]) => name);
        expect([...componentNames].sort()).toEqual(exported.sort());
        // `Form` is a plain object of parts. `<form>` is already an element, so
        // it is imported rather than registered.
        expect(componentNames).not.toContain('Form');
        expect(componentNames).toContain('FormRoot');
    });

    it('lists composables under the names they are exported by', () => {
        for (const name of composableNames) expect(typeof (vitral as Record<string, unknown>)[name]).toBe('function');
        expect(composableNames).toContain('useTheme');
    });
});
