import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import {
    compileTheme,
    contrastRatio,
    tokenCollisions,
    colorSchemeAttrs,
    colorSchemeScript,
    createThemeManager,
    parseDarkModeSelector,
    Astra,
    Avalonia,
    Ink,
    palette,
    Prism,
    Simple,
    updatePrimaryPalette,
    varName
} from './index';

describe('compileTheme', () => {
    it('names properties by path, drops `root`, and turns references into var()', () => {
        const { css, light, dark } = compileTheme({
            primitive: { blue: { 500: '#3b82f6' } },
            semantic: { primary: { color: '{blue.500}' }, colorScheme: { light: { text: { color: '#111' } }, dark: { text: { color: '#eee' } } } },
            components: { button: { root: { paddingX: 'calc({primary.color} * 0)' } } }
        });
        expect(light['--vt-blue-500']).toBe('#3b82f6');
        expect(light['--vt-primary-color']).toBe('var(--vt-blue-500)');
        expect(light['--vt-button-padding-x']).toBe('calc(var(--vt-primary-color) * 0)');
        expect(light['--vt-text-color']).toBe('#111');
        expect(dark['--vt-text-color']).toBe('#eee');
        expect(css).toContain(':root.vt-dark {');
    });

    it('follows the system, a custom selector, or a layer on request', () => {
        const preset = { semantic: { colorScheme: { light: { a: '1' }, dark: { a: '2' } } } };
        expect(compileTheme(preset, { darkModeSelector: 'system' }).css).toContain('@media (prefers-color-scheme: dark)');
        expect(compileTheme(preset, { darkModeSelector: '[data-theme="dark"]' }).css).toContain(':root[data-theme="dark"]');
        expect(compileTheme(preset, { cssLayer: 'vitral', prefix: 'x' }).css).toMatch(/^@layer vitral \{\n:root \{\n {2}--x-a: 1;/);
        expect(varName('button.root.borderRadius', 'x')).toBe('--x-button-border-radius');
    });

    it('compiles every shipped preset, leaving no reference unresolved', () => {
        for (const preset of [Prism, Ink, Avalonia, Simple, Astra]) {
            const { css } = compileTheme(preset);
            expect(css).not.toMatch(/\{[a-zA-Z]/);
            expect(css).toContain('--vt-form-field-background');
            expect(css).toContain('--vt-button-border-radius');
        }
    });
});

describe('token namespaces', () => {
    const presets = { Prism, Ink, Avalonia, Simple, Astra };

    it('never lets two layers declare the same property, in any shipped preset', () => {
        for (const [name, preset] of Object.entries(presets)) expect(tokenCollisions(preset), name).toEqual([]);
    });

    it('keeps the chart component beside the semantic chart palette without touching it', () => {
        const { light } = compileTheme(Prism);
        for (let i = 1; i <= 8; i++) expect(light[`--vt-chart-${i}`], `--vt-chart-${i}`).toMatch(/^var\(--vt-[a-z]+-500\)$/);
        expect(light['--vt-chart-axis-color']).toBe('var(--vt-text-muted-color)');
        // A component token refers to the palette by reference, and gets the palette.
        const withRef = compileTheme({ ...Prism, components: { ...Prism.components, chart: { ...Prism.components!.chart, crosshair: { color: '{chart.2}' } } } });
        expect(withRef.light['--vt-chart-crosshair-color']).toBe('var(--vt-chart-2)');
        expect(withRef.light['--vt-chart-2']).toBe(light['--vt-chart-2']);
        const walk = (tree: unknown, path: string): string[] =>
            tree && typeof tree === 'object' ? Object.entries(tree).flatMap(([k, v]) => [...(/^\d+$/.test(k) ? [`${path}.${k}`] : []), ...walk(v, `${path}.${k}`)]) : [];
        expect(walk(Prism.components!.chart, 'chart')).toEqual([]);
    });

    it('reports a component token that would shadow a palette colour', () => {
        const clash = tokenCollisions({ ...Prism, components: { ...Prism.components, chart: { 1: 'red', colorScheme: { dark: { 2: 'blue' } } } } });
        expect(clash.map((c) => c.variable).sort()).toEqual(['--vt-chart-1', '--vt-chart-2']);
        expect(clash[0]!.layers).toEqual(['semantic', 'components.chart']);
    });

    it('styles Chart, Schedule, Taskboard, Editor and Form only with declared tokens', () => {
        const { light, dark } = compileTheme(Prism);
        const known = new Set([...Object.keys(light), ...Object.keys(dark)]);
        // Set per instance or per element, not by the theme.
        const local = new Set(['--vt-schedule-rows', '--vt-schedule-event-accent', '--vt-chart-origin']);
        const root = `${process.cwd()}/packages/`;
        const missing: string[] = [];
        for (const name of ['Chart', 'Schedule', 'Taskboard', 'Editor', 'Form']) {
            // The chart's stylesheet lives with its framework-free renderer.
            const files = [name === 'Chart' ? `${root}chart/src/style/chart.css` : `${root}styles/src/${name.toLowerCase()}/${name.toLowerCase()}.css`];
            const dir = `${root}vue/src/components/${name}`;
            if (!existsSync(dir)) continue;
            for (const f of readdirSync(dir, { recursive: true }) as string[]) if (f.endsWith('.vue') || (f.endsWith('.ts') && !f.endsWith('.spec.ts'))) files.push(`${dir}/${f}`);
            for (const file of files)
                for (const m of readFileSync(file, 'utf8').matchAll(/--vt-[a-z0-9-]+/g))
                    if (!known.has(m[0]) && !local.has(m[0]) && !/^--vt-chart-$/.test(m[0])) missing.push(`${file.split('/').pop()}: ${m[0]}`);
        }
        // The chart package: engine, renderer and class map.
        for (const file of readdirSync(`${root}chart/src`, { recursive: true }) as string[]) {
            if (!file.endsWith('.ts') || file.endsWith('.spec.ts')) continue;
            for (const m of readFileSync(`${root}chart/src/${file}`, 'utf8').matchAll(/--vt-[a-z0-9-]+/g))
                if (!known.has(m[0]) && !local.has(m[0]) && m[0] !== '--vt-chart-') missing.push(`${file}: ${m[0]}`);
        }
        expect([...new Set(missing)]).toEqual([]);
    });
});

describe('icon buttons', () => {
    it('gives every close, remove and clear button one shape, which a theme changes in one place', () => {
        const parts = ['tag-remove-button', 'chip-remove-button', 'dialog-header-button', 'drawer-header-button', 'toast-close-button', 'message-close-button'];
        for (const preset of [Prism, Ink, Avalonia, Simple, Astra]) {
            const { light } = compileTheme(preset);
            for (const part of parts) expect(light[`--vt-${part}-border-radius`], part).toBe('var(--vt-icon-button-border-radius)');
        }
        expect(compileTheme(Prism).light['--vt-icon-button-border-radius']).toBe('var(--vt-border-radius-pill)');
        // The square theme keeps them square.
        expect(compileTheme(Simple).light['--vt-icon-button-border-radius']).toBe('var(--vt-border-radius-sm)');
    });
});

describe('palette', () => {
    it('keeps the colour at 500 and lightens and darkens around it', () => {
        const p = palette('#0078d4');
        expect(p[500]).toBe('#0078d4');
        expect(contrastRatio(p[50], '#ffffff')).toBeLessThan(1.2);
        expect(contrastRatio(p[950], '#000000')).toBeLessThan(2);
        expect(palette('{emerald}')[300]).toBe('{emerald.300}');
    });

    it('re-derives the scheme primaries when the palette changes, over a pinned accent', () => {
        const updated = updatePrimaryPalette(Avalonia, '{emerald}');
        const { light } = compileTheme(updated);
        expect(light['--vt-primary-500']).toBe('var(--vt-emerald-500)');
        expect(light['--vt-primary-color']).toBe('var(--vt-primary-600)');
    });
});

describe('theme manager', () => {
    it('injects one stylesheet and puts the dark class on <html>', () => {
        const manager = createThemeManager({ preset: Prism, colorScheme: 'light' });
        manager.mount();
        expect(document.head.querySelectorAll('style[data-vitral-theme]')).toHaveLength(1);
        expect(document.documentElement.classList.contains('vt-dark')).toBe(false);
        const seen: boolean[] = [];
        manager.subscribe((s) => seen.push(s.dark));
        manager.toggleDark();
        expect(document.documentElement.classList.contains('vt-dark')).toBe(true);
        expect(seen).toEqual([true]);
        manager.destroy();
        expect(document.head.querySelector('style[data-vitral-theme]')).toBeNull();
    });
});

describe('colour scheme helpers', () => {
    it('reads a class, an attribute or neither out of the selector', () => {
        expect(parseDarkModeSelector('.vt-dark')).toEqual({ kind: 'class', name: 'vt-dark' });
        expect(parseDarkModeSelector('[data-theme="dark"]')).toEqual({ kind: 'attribute', name: 'data-theme', value: 'dark' });
        expect(parseDarkModeSelector('[data-dark]')).toEqual({ kind: 'attribute', name: 'data-dark', value: '' });
        // The media query does the work, so nothing goes on the element.
        expect(parseDarkModeSelector('system')).toBeNull();
        expect(parseDarkModeSelector(false)).toBeNull();
    });

    it('says what <html> should carry for a given scheme', () => {
        expect(colorSchemeAttrs(true)).toEqual({ class: 'vt-dark' });
        expect(colorSchemeAttrs(false)).toEqual({});
        expect(colorSchemeAttrs(true, '[data-theme="dark"]')).toEqual({ 'data-theme': 'dark' });
    });

    it('writes a script that marks <html> before the first paint', () => {
        const script = colorSchemeScript({ storageKey: 'vt-scheme' });
        expect(script).toContain('localStorage.getItem("vt-scheme")');
        expect(script).toContain('prefers-color-scheme: dark');
        expect(script).toContain('classList.toggle("vt-dark"');

        // Run it the way the page would: the class has to land on <html>.
        document.documentElement.classList.remove('vt-dark');
        localStorage.setItem('vt-scheme', 'dark');
        new Function(script)();
        expect(document.documentElement.classList.contains('vt-dark')).toBe(true);
        localStorage.setItem('vt-scheme', 'light');
        new Function(script)();
        expect(document.documentElement.classList.contains('vt-dark')).toBe(false);
        localStorage.removeItem('vt-scheme');

        expect(colorSchemeScript({ darkModeSelector: '[data-theme="dark"]' })).toContain('setAttribute("data-theme","dark")');
        expect(colorSchemeScript({ darkModeSelector: 'system' })).toBe('');
    });
});
