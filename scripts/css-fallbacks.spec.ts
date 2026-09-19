import { describe, expect, it } from 'vitest';
import { colorMixFallbacks, containerFallbacks, webkitPrefixes } from './css-fallbacks';

describe('container query fallbacks', () => {
    it('repeats a container block as a media query of the same condition', () => {
        const out = containerFallbacks('@container tp (max-width: 640px) {\n.a { display: none; }\n}\n');
        expect(out).toContain('@supports not (container-type: inline-size)');
        expect(out).toContain('@media (max-width: 640px)');
        expect(out.match(/display: none/g)).toHaveLength(2);
    });

    it('keeps the original, and does nothing where there is no container', () => {
        const css = '.a { color: red; }';
        expect(containerFallbacks(css)).toBe(css);
        expect(containerFallbacks('@container tp (min-width: 60rem) { .b { gap: 1rem; } }')).toContain('@container tp (min-width: 60rem)');
    });

    it('finds the end of a block that has blocks inside it', () => {
        const out = containerFallbacks('@container tp (max-width: 40rem) {\n.a { color: red; }\n.b { color: blue; }\n}\n.after { color: green; }');
        // The copy stops at the container, not at the rule after it.
        expect(out.match(/color: green/g)).toHaveLength(1);
        expect(out.match(/color: blue/g)).toHaveLength(2);
    });
});

describe('colour mix fallbacks', () => {
    it('puts the colour the mix is a shade of in front of it', () => {
        const out = colorMixFallbacks('.bar { background: color-mix(in srgb, var(--vt-app-background) 82%, transparent); }');
        expect(out).toBe('.bar { background: var(--vt-app-background); background: color-mix(in srgb, var(--vt-app-background) 82%, transparent); }');
    });

    it('keeps the rest of a value around the mix', () => {
        const out = colorMixFallbacks('.g { border: 1px solid color-mix(in srgb, var(--c) 70%, transparent); }');
        expect(out).toContain('border: 1px solid var(--c); border: 1px solid color-mix(');
    });

    it('leaves a value with two mixes alone: two washes are not two colours', () => {
        const gradient = '.hero { background: linear-gradient(color-mix(in srgb, red 10%, transparent), color-mix(in srgb, blue 4%, transparent)); }';
        expect(colorMixFallbacks(gradient)).toBe(gradient);
        const plain = '.a { color: red; }';
        expect(colorMixFallbacks(plain)).toBe(plain);
    });

    it('takes the second colour of a mix as nothing, and other declarations as they are', () => {
        const out = colorMixFallbacks('.a { border-color: color-mix(in srgb, var(--p) 45%, var(--b)); color: red; }');
        expect(out).toContain('border-color: var(--p); border-color: color-mix(');
        expect(out).toContain('color: red');
        // A mix whose first colour is itself a function keeps its parentheses.
        expect(colorMixFallbacks('.b { background: color-mix(in srgb, rgb(1 2 3 / 50%) 20%, transparent); }')).toContain('background: rgb(1 2 3 / 50%); background: color-mix(');
    });
});

describe('webkit prefixes', () => {
    it('gives the properties Safari wanted by another name their twin', () => {
        expect(webkitPrefixes('.a { user-select: none; }')).toBe('.a { -webkit-user-select: none; user-select: none; }');
        expect(webkitPrefixes('.b { appearance: none; color: red; }')).toContain('-webkit-appearance: none; appearance: none;');
    });

    it('leaves alone what was written out by hand, and what needs nothing', () => {
        const byHand = '.a { -webkit-user-select: none; user-select: none; }';
        expect(webkitPrefixes(byHand)).toBe(byHand);
        const plain = '.a { color: red; display: flex; }';
        expect(webkitPrefixes(plain)).toBe(plain);
    });

    it('prefixes the same property in two rules', () => {
        const out = webkitPrefixes('.a { user-select: none; }\n.b { user-select: text; }');
        expect(out.match(/-webkit-user-select/g)).toHaveLength(2);
    });
});
