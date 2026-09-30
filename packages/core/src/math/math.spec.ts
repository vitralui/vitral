import { describe, expect, it } from 'vitest';
import { parseMath, type MathNode } from './parse';
import { drawMath, isMathLoaded, loadMath, mathToSvg, renderMath, renderMathDataUri, renderMathHTML, renderMathIn } from './index';
import { layoutMath, renderMathSvg } from './svg';

const only = (source: string): MathNode => {
    const root = parseMath(source);
    return root.type === 'row' && root.items.length === 1 ? root.items[0]! : root;
};

describe('math', () => {
    it('reads fractions, roots and scripts', () => {
        expect(only('\\frac{a}{2}')).toMatchObject({ type: 'frac', at: [0, 11], num: { type: 'row', at: [5, 8], items: [{ type: 'sym', text: 'a', kind: 'var', at: [6, 7] }] }, den: { type: 'row', items: [{ type: 'sym', text: '2', kind: 'num' }] } });
        expect(only('\\sqrt[3]{x}')).toMatchObject({ type: 'sqrt', index: { type: 'sym', text: '3' }, body: { type: 'row' } });
        expect(only('x_i^2')).toMatchObject({ type: 'script', base: { text: 'x' }, sub: { text: 'i' }, sup: { text: '2' } });
        // One character is the whole exponent unless it is grouped, as in TeX.
        expect(parseMath('x^10')).toMatchObject({ items: [{ type: 'script', sup: { text: '1' } }, { text: '0' }] });
        expect(only('x^{10}')).toMatchObject({ sup: { items: [{ text: '10' }] } });
    });

    it('tells a sign from an operator, and knows the usual names', () => {
        expect(parseMath('-b \\pm 3.5')).toMatchObject({ items: [{ text: '−', kind: 'ord' }, { text: 'b' }, { text: '±', kind: 'bin' }, { text: '3.5', kind: 'num' }] });
        expect(parseMath('a \\leq \\pi')).toMatchObject({ items: [{ text: 'a' }, { text: '≤', kind: 'rel' }, { text: 'π', kind: 'var' }] });
        expect(only('\\sum_{i=1}^{n}')).toMatchObject({ type: 'op', op: 'sum', sub: { type: 'row' }, sup: { type: 'row' } });
        expect(only('\\left( x \\right]')).toMatchObject({ type: 'fence', open: '(', close: ']' });
        expect(only('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')).toMatchObject({ type: 'matrix', open: '(', rows: [[{ text: 'a' }, { text: 'b' }], [{ text: 'c' }, { text: 'd' }]] });
        expect(parseMath('\\text{if } x')).toMatchObject({ items: [{ type: 'text', text: 'if ' }, { text: 'x' }] });
    });

    it('keeps what it cannot read, where it stood, and never throws', () => {
        expect(parseMath('a \\nope b')).toMatchObject({ items: [{ text: 'a' }, { type: 'error', text: '\\nope' }, { text: 'b' }] });
        for (const broken of ['\\frac{a', '}', 'x^', '\\left(', '\\sqrt[', '\\begin{pmatrix} a &', '{{{', '\\']) expect(() => parseMath(broken)).not.toThrow();
    });

    it('draws a formula as outlines, with no text for a browser to lay out', () => {
        const svg = renderMathSvg('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', { display: true });
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toMatch(/<text|font-family/);
        expect(svg).toContain('<path d="');
        // Sized in ems and hung from the baseline, so it follows the text it is in.
        expect(svg).toMatch(/width="[\d.]+em" height="[\d.]+em"/);
        expect(svg).toMatch(/style="vertical-align:-[\d.]+em"/);
        // The same source is the same drawing, to the last number.
        expect(renderMathSvg('\\sum_{i=1}^{n} i')).toBe(renderMathSvg('\\sum_{i=1}^{n} i'));
        for (const broken of ['\\frac{a', '}', 'x^', '\\left(', '\\sqrt[', '\\nope', '']) expect(() => renderMathSvg(broken)).not.toThrow();
    });

    it('marks each part with its place in the source when it is to be pressed', () => {
        const source = '\\frac{4}{2a}';
        const svg = renderMathSvg(source, { interactive: true });
        const parts = [...svg.matchAll(/data-at="(\d+),(\d+)"/g)].map((m) => source.slice(Number(m[1]), Number(m[2])));
        expect(parts).toEqual(expect.arrayContaining([source, '{4}', '4', '{2a}', '2', 'a']));
        expect(renderMathSvg(source)).not.toContain('data-at');
        // A single value says so, which is what makes it editable where it stands.
        expect(svg).toMatch(/<g data-at="6,7" data-leaf="">/);
        expect(svg).not.toMatch(/<g data-at="0,13" data-leaf/);
    });

    it('hands the drawing over without a style, and says where the baseline is', () => {
        const drawing = layoutMath('\\frac{1}{2}');
        expect(drawing.svg).not.toContain('style=');
        expect(drawing.svg).toContain(`aria-label="\\frac{1}{2}"`);
        expect(drawing.depth).toBeGreaterThan(0);
        expect(drawing.height).toBeGreaterThan(drawing.depth);
        expect(renderMathSvg('\\frac{1}{2}')).toContain(`style="vertical-align:${-drawing.depth}em"`);
        // Limits go above and below in a displayed formula, which makes it the taller of the two.
        expect(layoutMath('\\sum_{i=1}^{n} i', { display: true }).height).toBeGreaterThan(layoutMath('\\sum_{i=1}^{n} i').height);
    });

    it('draws nothing until the renderer has been loaded, and everything after', async () => {
        if (!isMathLoaded()) {
            expect(drawMath('x')).toBeNull();
            expect(mathToSvg('x')).toBeNull();
        }
        await loadMath();
        expect(isMathLoaded()).toBe(true);
        expect(drawMath('x')!.svg.startsWith('<svg')).toBe(true);
        expect(mathToSvg('a < "b"')).toContain('aria-label="a &lt; &quot;b&quot;"');
    });

    it('draws anything that can be typed: no input throws, and none puts a number that is not one in the drawing', () => {
        // Pieces a person editing a formula leaves half written, in every order a keyboard allows.
        const pieces = ['\\frac', '\\sqrt', '\\left', '\\right', '\\sum', '\\int', '\\lim', '\\begin{pmatrix}', '\\end{pmatrix}', '\\begin{cases}', '\\text', '\\overline', '\\nope', '\\', '{', '}', '[', ']', '(', ')', '^', '_', '&', '\\\\', 'x', '12', '3.5', '-', '+', '=', ' ', ',', '|', "'", 'é', 'Σ', '😀'];
        let seed = 20260930;
        const next = (n: number) => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed % n;
        };
        for (let run = 0; run < 1500; run++) {
            const source = Array.from({ length: 1 + next(14) }, () => pieces[next(pieces.length)]).join('');
            for (const display of [false, true]) {
                let svg = '';
                expect(() => (svg = renderMathSvg(source, { display, interactive: run % 2 === 0 })), source).not.toThrow();
                expect(/NaN|Infinity|undefined/.test(svg.replace(/aria-label="[^"]*"/, '')), source).toBe(false);
                // Every piece that can be pressed names a real piece of the source.
                for (const at of svg.matchAll(/data-at="(\d+),(\d+)"/g)) expect(Number(at[1]) <= Number(at[2]) && Number(at[2]) <= source.length, source).toBe(true);
            }
        }
    });

    it('draws a formula that stands on its own: sized in pixels, in a colour of its own', async () => {
        const inline = await renderMath('\\frac{1}{2}');
        expect(inline).toMatch(/width="[\d.]+em" height="[\d.]+em" fill="currentColor"/);
        expect(inline).toContain('style="vertical-align:');
        const file = await renderMath('\\frac{1}{2}', { fontSize: 20 });
        // No unit is pixels, which is what a PDF library and an image decoder read; and no baseline to hang from.
        expect(file).toMatch(/ width="[\d.]+" height="[\d.]+" fill="#000"/);
        expect(file).not.toContain('style=');
        expect(file.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
        const small = layoutMath('\\frac{1}{2}', { fontSize: 10 });
        const large = layoutMath('\\frac{1}{2}', { fontSize: 20 });
        expect(large.width).toBeCloseTo(small.width * 2, 1);
        expect(large.height).toBeCloseTo(layoutMath('\\frac{1}{2}').height * 20, 1);
        expect(await renderMath('x', { fontSize: 16, color: '#1d4ed8' })).toContain('fill="#1d4ed8"');
        const uri = await renderMathDataUri('x^2');
        expect(uri.startsWith('data:image/svg+xml;charset=utf-8,%3Csvg')).toBe(true);
        expect(decodeURIComponent(uri.split(',')[1]!)).toBe(await renderMath('x^2', { fontSize: 16 }));
    });

    it('draws the formulas of a page from their source, and writes HTML either way round', async () => {
        const lean = '<p>Area: <span data-math="\\frac{b h}{2}" contenteditable="false">\\frac{b h}{2}</span> and <span data-math="a &lt; &quot;b&quot;" data-display="true" contenteditable="false">a &lt; "b"</span>.</p>';
        document.body.innerHTML = lean;
        expect(await renderMathIn(document.body)).toBe(2);
        const drawn = document.querySelectorAll('[data-math] > svg');
        expect(drawn).toHaveLength(2);
        expect(drawn[1]!.getAttribute('aria-label')).toBe('a < "b"');
        expect((drawn[0] as SVGElement).style.verticalAlign).toMatch(/^-[\d.]+em$/);
        expect(await renderMathIn(document.createElement('div'))).toBe(0);
        document.body.innerHTML = '';

        const full = await renderMathHTML(lean);
        expect(full.match(/<svg style="vertical-align/g)).toHaveLength(2);
        expect(full).toContain('data-math="\\frac{b h}{2}" contenteditable="false"><svg');
        expect(full.length).toBeGreaterThan(lean.length * 5);
        // And back: the drawings out, the source left, to the letter.
        expect(await renderMathHTML(full, 'source')).toBe(lean);
        // HTML with no formula in it is left as it is.
        expect(await renderMathHTML('<p>No <span class="x">formula</span> here.</p>')).toBe('<p>No <span class="x">formula</span> here.</p>');
    });
});
