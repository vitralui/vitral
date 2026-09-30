import { MATH_GLYPHS, MATH_METRICS as M, type MathGlyph } from './glyphs';
import { parseMath, type MathFence, type MathNode } from './parse';

// A formula as a drawing: an SVG of outlines, with no text in it.
//
// Text is where browsers differ. Each one measures and places glyphs its own
// way, takes a sign the font lacks from a different fallback, rounds a line's
// height differently — so anything laid out by the browser is only ever nearly
// the same from one to the next. Here the browser lays out nothing. Every
// glyph is an outline this package carries, every position is arithmetic done
// here, in thousandths of an em, and what is handed over is paths at
// coordinates. The same numbers reach every browser, a PDF and a printer.
//
// The layout is TeX's, by the constants the font itself publishes for it
// (where the axis is, how far a numerator rises, how thick the rule is):
// boxes with a width, a height above the baseline and a depth below it.
//
// The drawing scales with the text around it (its size is in ems), sits on
// that text's baseline, and takes its colour. With `interactive`, each part
// carries the piece of the source it was read from, so a press on the drawing
// can be turned into a selection in the formula's text.

export interface MathSvgOptions {
    /** Set as a displayed formula: limits above and below their signs, fractions at full size. */
    display?: boolean;
    /**
     * Mark every part with where it came from in the source (`data-at="start,end"`),
     * and a part that is one value — a number, a letter, a word — with `data-leaf`,
     * and let each take a press.
     */
    interactive?: boolean;
    /**
     * The size of the text the formula is set at, in pixels, for a drawing
     * that stands on its own: a file, an image, a page of a PDF. With it the
     * drawing has a width and a height in pixels and a colour of its own
     * (`color`, black unless told otherwise), which is what anything that is
     * not a web page needs. Without it the drawing is sized in ems and takes
     * the colour of the text around it, which is what a page wants.
     */
    fontSize?: number;
    /** The colour of a drawing that stands on its own. Any CSS colour a consumer of the file understands. */
    color?: string;
}

/** A formula, drawn. */
export interface MathDrawing {
    /**
     * The `<svg>` element, with no `style` on it: a page with a strict content
     * security policy refuses one written in markup, so whoever puts this in a
     * document sets `vertical-align` from `depth` itself.
     */
    svg: string;
    /** In ems, or in pixels when a `fontSize` was given. */
    width: number;
    height: number;
    /** How far the drawing hangs below the baseline of the text it is in, in the same unit. */
    depth: number;
}

/** Display, text, script, and the script of a script. */
type Style = 0 | 1 | 2 | 3;
const SCALE = [1, 1, 0.7, 0.55] as const;
const smaller = (style: Style): Style => Math.min(3, Math.max(2, style + 1)) as Style;
const fractionPart = (style: Style): Style => Math.min(3, style + 1) as Style;

/** How an atom spaces against its neighbours. */
type Kind = 'ord' | 'op' | 'bin' | 'rel' | 'open' | 'close' | 'punct' | 'inner';

interface Box {
    w: number;
    /** Above the baseline. */
    h: number;
    /** Below it. */
    d: number;
    /** Markup drawn from the box's origin: the left end of its baseline. */
    svg: string;
    kind: Kind;
    /** A single glyph, which scripts attach to by their own rule rather than by its size. */
    char?: boolean;
}

const n = (value: number) => String(Math.round(value * 10) / 10);
const fine = (value: number) => String(Math.round(value * 10000) / 10000);
const escapeAttr = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const move = (box: Box, x: number, y: number) => (box.svg ? `<g transform="translate(${n(x)} ${n(y)})">${box.svg}</g>` : '');
const rule = (x: number, y: number, w: number, h: number) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/>`;
const empty = (w = 0): Box => ({ w, h: 0, d: 0, svg: '', kind: 'ord' });

/** A glyph at a scale, standing on the baseline. `stretch` draws it taller than it is, for a bracket no cut of the font reaches. */
function glyphBox(glyph: MathGlyph, scale: number, kind: Kind = 'ord', stretch = 1): Box {
    const [advance, low, high, d] = glyph;
    const transform = scale === 1 && stretch === 1 ? '' : ` transform="scale(${fine(scale)} ${fine(scale * stretch)})"`;
    return { w: advance * scale, h: high * scale * stretch, d: -low * scale * stretch, svg: `<path d="${d}"${transform}/>`, kind };
}

/** The italic a variable is set in: the mathematical alphabets, which have their own outlines and spacing. */
function italic(char: string): string {
    const code = char.codePointAt(0)!;
    if (char === 'h') return 'ℎ';
    if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(0x1d434 + code - 0x41);
    if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(0x1d44e + code - 0x61);
    if (code >= 0x3b1 && code <= 0x3c9) return String.fromCodePoint(0x1d6fc + code - 0x3b1);
    return char;
}

/** Upright text, glyph after glyph. What the outlines do not have is left as a gap its width. */
function textBox(text: string, scale: number, kind: Kind = 'ord', slanted = false): Box {
    let x = 0;
    let h = 0;
    let d = 0;
    let svg = '';
    for (const char of text) {
        const glyph = MATH_GLYPHS[slanted ? italic(char) : char] ?? MATH_GLYPHS[char];
        if (!glyph) {
            x += (char === ' ' ? 260 : 500) * scale;
            continue;
        }
        const box = glyphBox(glyph, scale);
        svg += move(box, x, 0);
        x += box.w;
        h = Math.max(h, box.h);
        d = Math.max(d, box.d);
    }
    return { w: x, h, d, svg, kind };
}

/**
 * A sign as tall as what it stands beside: the smallest cut of it in the font
 * that reaches `height`, or the largest stretched the rest of the way.
 */
function tall(char: string, height: number, scale: number): Box {
    let last = MATH_GLYPHS[char];
    if (!last) return empty();
    for (let cut = 0; ; cut++) {
        const glyph = cut === 0 ? MATH_GLYPHS[char] : MATH_GLYPHS[`${char}#${cut}`];
        if (!glyph) break;
        last = glyph;
        if ((glyph[2] - glyph[1]) * scale >= height) return glyphBox(glyph, scale);
    }
    return glyphBox(last, scale, 'ord', height / ((last[2] - last[1]) * scale));
}

/** Moves a box so that its middle is on the axis, the line the signs run along. */
function onAxis(box: Box, scale: number): Box {
    const shift = (box.h - box.d) / 2 - M.axisHeight * scale;
    return { ...box, h: box.h - shift, d: box.d + shift, svg: move(box, 0, shift) };
}

// The space between two atoms, in ems at the current size: TeX's table, by
// what each is. Scripts are set tight, with only the thin spaces left.
function gap(left: Kind, right: Kind, style: Style): number {
    const tight = style >= 2;
    const thin = 167;
    const medium = tight ? 0 : 222;
    const thick = tight ? 0 : 278;
    if (left === 'punct') return tight ? 0 : thin;
    if (left === 'bin' || right === 'bin') return left === 'open' || right === 'close' || right === 'punct' ? 0 : medium;
    if (left === 'rel' || right === 'rel') return left === 'open' || right === 'close' || right === 'punct' || (left === 'rel' && right === 'rel') ? 0 : thick;
    if (right === 'op') return left === 'open' ? 0 : thin;
    if (left === 'op') return right === 'ord' || right === 'inner' ? thin : 0;
    if (left === 'inner') return right === 'close' || right === 'punct' ? 0 : tight ? 0 : thin;
    if (right === 'inner') return left === 'open' ? 0 : tight ? 0 : thin;
    return 0;
}

const FENCE_KIND: Partial<Record<string, Kind>> = { '(': 'open', '[': 'open', ')': 'close', ']': 'close' };

/** Lays a formula out and draws it. `source` is LaTeX, the subset `parseMath` reads. */
export function layoutMath(source: string, options: MathSvgOptions = {}): MathDrawing {
    const tag = (node: MathNode, box: Box): Box => {
        if (!options.interactive || !node.at) return box;
        // The rectangle is what takes the press: a glyph alone is only hit on its ink.
        const hit = `<rect x="0" y="${n(-box.h)}" width="${n(box.w)}" height="${n(box.h + box.d)}" fill="none" pointer-events="all"/>`;
        const leaf = node.type === 'sym' || node.type === 'text' || node.type === 'fn' ? ' data-leaf=""' : '';
        return { ...box, svg: `<g data-at="${node.at[0]},${node.at[1]}"${leaf}>${hit}${box.svg}</g>` };
    };

    function row(items: MathNode[], style: Style): Box {
        const scale = SCALE[style];
        let x = 0;
        let h = 0;
        let d = 0;
        let svg = '';
        let before: Kind | null = null;
        let last: Kind = 'ord';
        for (const item of items) {
            const box = layout(item, style);
            if (item.type === 'space') {
                x += box.w;
                continue;
            }
            if (before) x += gap(before, box.kind, style) * scale;
            svg += move(box, x, 0);
            x += box.w;
            h = Math.max(h, box.h);
            d = Math.max(d, box.d);
            before = last = box.kind;
        }
        return { w: x, h, d, svg, kind: items.length === 1 ? last : 'ord' };
    }

    function fence(which: MathFence, body: Box, scale: number): Box {
        if (!which) return empty(120 * scale);
        // As tall as the body is either side of the axis, less a little: a bracket need not quite cover what it holds.
        const axis = M.axisHeight * scale;
        const reach = Math.max(body.h - axis, body.d + axis);
        return onAxis(tall(which, Math.max(2 * reach * 0.9, 2 * reach - 500 * scale), scale), scale);
    }

    function fenced(open: MathFence, close: MathFence, body: Box, scale: number): Box {
        const left = fence(open, body, scale);
        const right = fence(close, body, scale);
        return {
            w: left.w + body.w + right.w,
            h: Math.max(left.h, body.h, right.h),
            d: Math.max(left.d, body.d, right.d),
            svg: move(left, 0, 0) + move(body, left.w, 0) + move(right, left.w + body.w, 0),
            kind: 'inner'
        };
    }

    function scripts(base: Box, sup: MathNode | undefined, sub: MathNode | undefined, style: Style): Box {
        const scale = SCALE[style];
        const inner = smaller(style);
        const small = SCALE[inner];
        const above = sup ? layout(sup, inner) : null;
        const below = sub ? layout(sub, inner) : null;
        // How far each moves from the baseline: by the font's own distances for a
        // letter, and measured from the top and the bottom of anything taller.
        let up = base.char ? 0 : base.h - M.superscriptBaselineDropMax * small;
        let down = base.char ? 0 : base.d + M.subscriptBaselineDropMin * small;
        if (above) up = Math.max(up, M.superscriptShiftUp * scale, above.d + (M.xHeight * scale) / 4);
        if (below) down = Math.max(down, M.subscriptShiftDown * scale, below.h - M.xHeight * scale * 0.8);
        if (above && below) {
            const between = up - above.d - (below.h - down);
            if (between < M.subSuperscriptGapMin * scale) down += M.subSuperscriptGapMin * scale - between;
        }
        const x = base.w + 30 * scale;
        return {
            w: x + Math.max(above?.w ?? 0, below?.w ?? 0) + 40 * scale,
            h: Math.max(base.h, above ? up + above.h : 0),
            d: Math.max(base.d, below ? down + below.d : 0),
            svg: move(base, 0, 0) + (above ? move(above, x, -up) : '') + (below ? move(below, x, down) : ''),
            kind: base.kind
        };
    }

    /** One over another around something in the middle: the limits of a sum. */
    function stacked(middle: Box, over: Box | null, under: Box | null, scale: number): Box {
        const w = Math.max(middle.w, over?.w ?? 0, under?.w ?? 0);
        const centre = (box: Box) => (w - box.w) / 2;
        const overY = -(middle.h + M.upperLimitGapMin * scale + (over?.d ?? 0));
        const underY = middle.d + M.lowerLimitGapMin * scale + (under?.h ?? 0);
        return {
            w,
            h: over ? -overY + over.h : middle.h,
            d: under ? underY + under.d : middle.d,
            svg: move(middle, centre(middle), 0) + (over ? move(over, centre(over), overY) : '') + (under ? move(under, centre(under), underY) : ''),
            kind: 'op'
        };
    }

    function layout(node: MathNode, style: Style): Box {
        return tag(node, draw(node, style));
    }

    function draw(node: MathNode, style: Style): Box {
        const scale = SCALE[style];
        const display = style === 0;
        switch (node.type) {
            case 'row':
                return row(node.items, style);
            case 'sym': {
                const kind: Kind = node.kind === 'bin' || node.kind === 'rel' || node.kind === 'punct' ? node.kind : (FENCE_KIND[node.text] ?? 'ord');
                const box = textBox(node.text, scale, kind, node.kind === 'var');
                return { ...box, char: true };
            }
            case 'text':
                return textBox(node.text, scale);
            case 'fn':
                return textBox(node.name, scale, 'op');
            case 'space':
                return empty(node.width * 1000 * scale);
            case 'error':
                return { ...textBox(node.text || '?', scale), svg: `<g class="vt-math-error">${textBox(node.text || '?', scale).svg}</g>` };
            case 'over': {
                const body = layout(node.body, style);
                const thickness = M.overbarRuleThickness * scale;
                const y = body.h + M.overbarVerticalGap * scale;
                return { w: body.w, h: y + thickness, d: body.d, svg: body.svg + rule(0, -(y + thickness), body.w, thickness), kind: 'ord' };
            }
            case 'frac': {
                const part = fractionPart(style);
                const num = layout(node.num, part);
                const den = layout(node.den, part);
                const thickness = M.fractionRuleThickness * scale;
                const axis = M.axisHeight * scale;
                const clearance = (display ? M.fractionNumDisplayStyleGapMin : M.fractionNumeratorGapMin) * scale;
                // Each part is moved the font's distance from the baseline, and further if that would bring it too near the bar.
                const up = Math.max((display ? M.fractionNumeratorDisplayStyleShiftUp : M.fractionNumeratorShiftUp) * scale, axis + thickness / 2 + clearance + num.d);
                const down = Math.max((display ? M.fractionDenominatorDisplayStyleShiftDown : M.fractionDenominatorShiftDown) * scale, den.h + clearance - (axis - thickness / 2));
                const side = 110 * scale;
                const w = Math.max(num.w, den.w) + 2 * side;
                return {
                    w,
                    h: up + num.h,
                    d: down + den.d,
                    svg: move(num, (w - num.w) / 2, -up) + rule(0, -(axis + thickness / 2), w, thickness) + move(den, (w - den.w) / 2, down),
                    kind: 'inner'
                };
            }
            case 'sqrt': {
                const body = layout(node.body, style);
                const thickness = M.radicalRuleThickness * scale;
                let clearance = (display ? M.radicalDisplayStyleVerticalGap : M.radicalVerticalGap) * scale;
                const needed = body.h + body.d + clearance + thickness;
                const sign = tall('√', needed, scale);
                // A cut of the sign taller than was needed: the body takes the room above and below alike.
                const height = sign.h + sign.d;
                if (height > needed) clearance += (height - needed) / 2;
                const top = body.h + clearance + thickness;
                // The sign's top is the rule's top; its foot hangs wherever that leaves it.
                const signY = sign.h - top;
                let x = 0;
                let svg = '';
                let h = top + M.radicalExtraAscender * scale;
                if (node.index) {
                    const index = layout(node.index, 3);
                    // The index sits in the crook of the sign, six tenths of the way up it.
                    const indexY = signY + sign.d - 0.6 * height;
                    x = Math.max(0, index.w - sign.w * 0.45);
                    svg += move(index, Math.max(0, sign.w * 0.45 - index.w) + 40 * scale, indexY);
                    h = Math.max(h, -indexY + index.h);
                }
                svg += move(sign, x, signY) + rule(x + sign.w, -top, body.w + 40 * scale, thickness) + move(body, x + sign.w, 0);
                return { w: x + sign.w + body.w + 40 * scale, h, d: Math.max(body.d, signY + sign.d), svg, kind: 'ord' };
            }
            case 'fence':
                return fenced(node.open, node.close, layout(node.body, style), scale);
            case 'matrix': {
                const cells = node.rows.map((cells) => cells.map((cell) => layout(cell, Math.max(1, style) as Style)));
                const columns = Math.max(1, ...cells.map((r) => r.length));
                const widths = Array.from({ length: columns }, (_, c) => Math.max(0, ...cells.map((r) => r[c]?.w ?? 0)));
                const columnGap = (node.align === 'left' ? 1000 : 800) * scale;
                const rowGap = 250 * scale;
                // A row is at least a line of text tall, so rows of short things keep an even step.
                const heights = cells.map((r) => Math.max(700 * scale, ...r.map((b) => b.h)));
                const depths = cells.map((r) => Math.max(230 * scale, ...r.map((b) => b.d)));
                const total = heights.reduce((a, b) => a + b, 0) + depths.reduce((a, b) => a + b, 0) + rowGap * (cells.length - 1);
                const top = M.axisHeight * scale + total / 2;
                let svg = '';
                let y = -top;
                cells.forEach((r, i) => {
                    y += heights[i]!;
                    let x = 0;
                    r.forEach((box, c) => {
                        svg += move(box, node.align === 'left' ? x : x + (widths[c]! - box.w) / 2, y);
                        x += widths[c]! + columnGap;
                    });
                    y += depths[i]! + rowGap;
                });
                const w = widths.reduce((a, b) => a + b, 0) + columnGap * (columns - 1);
                const pad = 100 * scale;
                const grid: Box = { w: w + 2 * pad, h: top, d: total - top, svg: `<g transform="translate(${n(pad)} 0)">${svg}</g>`, kind: 'inner' };
                return fenced(node.open, node.close, grid, scale);
            }
            case 'script':
                return scripts(layout(node.base, style), node.sup, node.sub, style);
            case 'op': {
                // The sign is the larger cut in a displayed formula, and sits on the axis either way.
                const sign = node.op === 'lim' ? textBox('lim', scale, 'op') : onAxis(glyphBox(MATH_GLYPHS[({ sum: '∑', prod: '∏', int: '∫' } as const)[node.op] + (display ? '#1' : '')]!, scale, 'op'), scale);
                if (!node.sup && !node.sub) return sign;
                // Limits go above and below a sum in a displayed formula, and beside it in a line of text; an integral's are always beside.
                if (display && node.op !== 'int') return stacked(sign, node.sup ? layout(node.sup, 2) : null, node.sub ? layout(node.sub, 2) : null, scale);
                return scripts(sign, node.sup, node.sub, style);
            }
        }
    }

    const root = parseMath(source);
    const box = row(root.type === 'row' ? root.items : [root], options.display ? 0 : 1);
    // A little room around the ink, so a stroke at the edge is not cut, and never flatter than a line of text.
    const pad = 40;
    const h = Math.max(box.h, 700) + pad;
    const d = Math.max(box.d, 200) + pad;
    const w = box.w + 2 * pad;
    // Sized by the text around it, or, standing on its own, in pixels of the size it was asked for.
    const own = typeof options.fontSize === 'number' && options.fontSize > 0;
    const size = (units: number) => (own ? Math.round((units * options.fontSize!) / 10) / 100 : Math.round(units) / 1000);
    const unit = own ? '' : 'em';
    const fill = own ? (options.color ?? '#000') : (options.color ?? 'currentColor');
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeAttr(source)}"` +
        ` viewBox="${-pad} ${n(-h)} ${n(w)} ${n(h + d)}" width="${size(w)}${unit}" height="${size(h + d)}${unit}" fill="${escapeAttr(fill)}">${box.svg}</svg>`;
    return { svg, width: size(w), height: size(h + d), depth: size(d) };
}

/**
 * A formula as one string of markup that stands on its own: the drawing with
 * its place on the baseline written into it. What an export carries — HTML to
 * be stored, mailed or printed.
 */
export function renderMathSvg(source: string, options: MathSvgOptions = {}): string {
    const drawing = layoutMath(source, options);
    // A drawing with a size of its own is a file, not a piece of a line: it has no baseline to hang from.
    if (typeof options.fontSize === 'number' && options.fontSize > 0) return drawing.svg;
    return drawing.svg.replace('<svg ', `<svg style="vertical-align:${-drawing.depth}em" `);
}
