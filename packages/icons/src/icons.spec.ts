import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { severityIcon } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { iconCategories } from './categories';
import * as barrel from './icons/index';
import { sets } from './icons/all';
import { baseIcons, getIcon, registerIcons, renderSvg } from './runtime';
import { categories, iconList, icons } from './registry';
import type { IconDef } from './types';

/**
 * The set is data, so it is checked as data: every icon well formed, drawn on
 * the grid in the house style, filed and findable — and every name the
 * library and the site ask for actually there.
 */

const all = Object.entries(icons) as [string, IconDef][];
const root = join(import.meta.dirname, '../../..');

// ---- geometry ---------------------------------------------------------------

type Point = [number, number];

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** Points along a path — endpoints, sampled curves and arcs — enough to bound it. */
function pathPoints(d: string): Point[] {
    const out: Point[] = [];
    const tokens = d.match(/[a-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
    let i = 0;
    let cmd = '';
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let cx = 0; // last control point, for S/T
    let cy = 0;
    let prev = '';
    const num = () => {
        const t = tokens[i++];
        if (t === undefined || /[a-z]/i.test(t)) throw new Error(`bad path data: ${d}`);
        return Number(t);
    };
    const cubic = (x1: number, y1: number, x2: number, y2: number, ex: number, ey: number) => {
        for (let s = 1; s <= 16; s++) {
            const t = s / 16;
            const m = 1 - t;
            out.push([
                m * m * m * x + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * ex,
                m * m * m * y + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * ey
            ]);
        }
    };
    const quad = (x1: number, y1: number, ex: number, ey: number) => {
        for (let s = 1; s <= 16; s++) {
            const t = s / 16;
            const m = 1 - t;
            out.push([m * m * x + 2 * m * t * x1 + t * t * ex, m * m * y + 2 * m * t * y1 + t * t * ey]);
        }
    };
    const arcTo = (rx: number, ry: number, rot: number, large: number, sweep: number, ex: number, ey: number) => {
        // SVG 1.1 F.6.5: endpoint to centre parameterisation.
        rx = Math.abs(rx);
        ry = Math.abs(ry);
        if (!rx || !ry) return out.push([ex, ey]);
        const phi = (rot * Math.PI) / 180;
        const cos = Math.cos(phi);
        const sin = Math.sin(phi);
        const dx = (x - ex) / 2;
        const dy = (y - ey) / 2;
        const x1 = cos * dx + sin * dy;
        const y1 = -sin * dx + cos * dy;
        const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
        if (lambda > 1) {
            rx *= Math.sqrt(lambda);
            ry *= Math.sqrt(lambda);
        }
        const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
        const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
        const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num2 / den));
        const cxp = (coef * rx * y1) / ry;
        const cyp = (-coef * ry * x1) / rx;
        const ccx = cos * cxp - sin * cyp + (x + ex) / 2;
        const ccy = sin * cxp + cos * cyp + (y + ey) / 2;
        const angle = (ux: number, uy: number, vx: number, vy: number) => {
            const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
            return a;
        };
        const t1 = angle(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
        let dt = angle((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
        if (!sweep && dt > 0) dt -= 2 * Math.PI;
        if (sweep && dt < 0) dt += 2 * Math.PI;
        for (let s = 1; s <= 32; s++) {
            const t = t1 + (dt * s) / 32;
            out.push([ccx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, ccy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos]);
        }
    };
    while (i < tokens.length) {
        if (/[a-z]/i.test(tokens[i]!)) cmd = tokens[i++]!;
        else if (!cmd) throw new Error(`path must start with a command: ${d}`);
        const rel = cmd === cmd.toLowerCase();
        const ox = rel ? x : 0;
        const oy = rel ? y : 0;
        switch (cmd.toUpperCase()) {
            case 'M': {
                x = ox + num();
                y = oy + num();
                sx = x;
                sy = y;
                out.push([x, y]);
                cmd = rel ? 'l' : 'L';
                break;
            }
            case 'L':
                x = ox + num();
                y = oy + num();
                out.push([x, y]);
                break;
            case 'H':
                x = ox + num();
                out.push([x, y]);
                break;
            case 'V':
                y = oy + num();
                out.push([x, y]);
                break;
            case 'C': {
                const x1 = ox + num();
                const y1 = oy + num();
                const x2 = ox + num();
                const y2 = oy + num();
                const ex = ox + num();
                const ey = oy + num();
                cubic(x1, y1, x2, y2, ex, ey);
                [cx, cy, x, y] = [x2, y2, ex, ey];
                break;
            }
            case 'S': {
                const [x1, y1] = /[cs]/i.test(prev) ? [2 * x - cx, 2 * y - cy] : [x, y];
                const x2 = ox + num();
                const y2 = oy + num();
                const ex = ox + num();
                const ey = oy + num();
                cubic(x1, y1, x2, y2, ex, ey);
                [cx, cy, x, y] = [x2, y2, ex, ey];
                break;
            }
            case 'Q': {
                const x1 = ox + num();
                const y1 = oy + num();
                const ex = ox + num();
                const ey = oy + num();
                quad(x1, y1, ex, ey);
                [cx, cy, x, y] = [x1, y1, ex, ey];
                break;
            }
            case 'T': {
                const [x1, y1] = /[qt]/i.test(prev) ? [2 * x - cx, 2 * y - cy] : [x, y];
                const ex = ox + num();
                const ey = oy + num();
                quad(x1, y1, ex, ey);
                [cx, cy, x, y] = [x1, y1, ex, ey];
                break;
            }
            case 'A': {
                const [rx, ry, rot, large, sweep] = [num(), num(), num(), num(), num()];
                const ex = ox + num();
                const ey = oy + num();
                arcTo(rx, ry, rot, large, sweep, ex, ey);
                x = ex;
                y = ey;
                break;
            }
            case 'Z':
                x = sx;
                y = sy;
                break;
            default:
                throw new Error(`unknown path command ${cmd}`);
        }
        prev = cmd;
    }
    return out;
}

const attr = (el: Element, name: string) => Number(el.getAttribute(name) ?? 0);

function elementPoints(el: Element): Point[] {
    switch (el.tagName) {
        case 'path':
            return pathPoints(el.getAttribute('d') ?? '');
        case 'circle': {
            const [cx, cy, r] = [attr(el, 'cx'), attr(el, 'cy'), attr(el, 'r')];
            return [[cx - r, cy - r], [cx + r, cy + r]];
        }
        case 'ellipse': {
            const [cx, cy, rx, ry] = [attr(el, 'cx'), attr(el, 'cy'), attr(el, 'rx'), attr(el, 'ry')];
            return [[cx - rx, cy - ry], [cx + rx, cy + ry]];
        }
        case 'rect': {
            const [x, y, w, h] = [attr(el, 'x'), attr(el, 'y'), attr(el, 'width'), attr(el, 'height')];
            return [[x, y], [x + w, y + h]];
        }
        case 'line':
            return [[attr(el, 'x1'), attr(el, 'y1')], [attr(el, 'x2'), attr(el, 'y2')]];
        default: {
            const values = (el.getAttribute('points') ?? '').match(NUMBER)?.map(Number) ?? [];
            const pts: Point[] = [];
            for (let k = 0; k + 1 < values.length; k += 2) pts.push([values[k]!, values[k + 1]!]);
            return pts;
        }
    }
}

const ALLOWED: Record<string, readonly string[]> = {
    path: ['d'],
    circle: ['cx', 'cy', 'r'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
    line: ['x1', 'y1', 'x2', 'y2'],
    polyline: ['points'],
    polygon: ['points']
};
const SHARED = ['fill'];

function parse(def: IconDef): Document {
    return new DOMParser().parseFromString(renderSvg(def), 'image/svg+xml');
}

// ---- the set ------------------------------------------------------------------

describe('the icon set', () => {
    it('is several hundred icons, each exported under its own name', () => {
        expect(all.length).toBeGreaterThanOrEqual(500);
        for (const [key, def] of all) expect(def.name, key).toBe(key);
        expect(Object.keys(barrel).sort()).toEqual(Object.keys(icons).sort());
        expect(iconList).toHaveLength(all.length);
    });

    it('has unique camelCase names', () => {
        const names = iconList.map((def) => def.name);
        expect(new Set(names).size).toBe(names.length);
        for (const name of names) expect(name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });

    it('files every icon under a known category, the one its file is named after', () => {
        const ids = iconCategories.map((c) => c.id);
        expect(Object.keys(sets).sort()).toEqual([...ids].sort());
        for (const [id, set] of Object.entries(sets)) {
            for (const def of Object.values(set) as IconDef[]) expect(def.category, def.name).toBe(id);
        }
        for (const category of categories) expect(category.icons.length, category.id).toBeGreaterThan(0);
    });

    it('gives every icon English search tags', () => {
        for (const def of iconList) {
            expect(def.tags?.length, def.name).toBeGreaterThan(0);
            for (const tag of def.tags!) expect(tag, def.name).toMatch(/^[a-z0-9][a-z0-9 '&+-]*$/);
        }
    });

    it('draws on the 24 grid with no viewBox of its own', () => {
        for (const def of iconList) expect(def.viewBox, def.name).toBeUndefined();
    });

    it.each(all)('%s parses as SVG made of plain shapes', (_, def) => {
        const doc = parse(def);
        expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
        const svg = doc.documentElement;
        expect(svg.tagName).toBe('svg');
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svg.children.length).toBeGreaterThan(0);
        for (const el of Array.from(svg.children)) {
            expect(Object.keys(ALLOWED), `${def.name}: <${el.tagName}>`).toContain(el.tagName);
            expect(el.children, `${def.name}: <${el.tagName}> has children`).toHaveLength(0);
            for (const { name, value } of Array.from(el.attributes)) {
                expect([...ALLOWED[el.tagName]!, ...SHARED], `${def.name}: <${el.tagName} ${name}>`).toContain(name);
                if (name === 'fill') expect(['none', 'currentColor'], def.name).toContain(value);
                else if (name !== 'd' && name !== 'points') expect(value, `${def.name}: ${name}`).toMatch(/^-?(\d+\.?\d*|\.\d+)$/);
            }
        }
    });

    it.each(all)('%s stays inside the 24 grid, stroke included', (_, def) => {
        const svg = parse(def).documentElement;
        const points = Array.from(svg.children).flatMap(elementPoints);
        expect(points.length).toBeGreaterThan(0);
        for (const [x, y] of points) {
            expect(Number.isFinite(x) && Number.isFinite(y), def.name).toBe(true);
            // Half the 2-unit stroke must still land on the canvas.
            expect(x, `${def.name} x`).toBeGreaterThanOrEqual(0.95);
            expect(x, `${def.name} x`).toBeLessThanOrEqual(23.05);
            expect(y, `${def.name} y`).toBeGreaterThanOrEqual(0.95);
            expect(y, `${def.name} y`).toBeLessThanOrEqual(23.05);
        }
    });
});

// ---- runtime ------------------------------------------------------------------

describe('the runtime', () => {
    it('renders a standalone SVG on the 24 grid with the house stroke', () => {
        const svg = new DOMParser().parseFromString(renderSvg(icons.check), 'image/svg+xml').documentElement;
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svg.getAttribute('stroke-width')).toBe('2');
        expect(svg.getAttribute('stroke-linecap')).toBe('round');
        expect(svg.getAttribute('stroke-linejoin')).toBe('round');
        expect(svg.getAttribute('fill')).toBe('none');
        expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps an icon of its own grid, and lets attributes override', () => {
        const custom: IconDef = { name: 'tiny', body: '<path d="M1 1h14"/>', viewBox: '0 0 16 16' };
        const svg = new DOMParser().parseFromString(renderSvg(custom, { 'stroke-width': '1.5', title: 'a "quoted" & value' }), 'image/svg+xml').documentElement;
        expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
        expect(svg.getAttribute('stroke-width')).toBe('1.5');
        expect(svg.getAttribute('title')).toBe('a "quoted" & value');
    });

    it('resolves the base icons by name without registering anything, and others once registered', () => {
        for (const def of baseIcons) expect(getIcon(def.name)).toBe(def);
        expect(getIcon('graduationCap')).toBeUndefined();
        expect(getIcon('nope')).toBeUndefined();
        registerIcons([icons.graduationCap]);
        expect(getIcon('graduationCap')).toBe(icons.graduationCap);
        const mine: IconDef = { name: 'mine', body: '<circle cx="12" cy="12" r="4"/>' };
        registerIcons({ mine });
        expect(getIcon('mine')).toBe(mine);
    });

    it('covers every severity with a base icon', () => {
        const base = new Set(baseIcons.map((def) => def.name));
        for (const severity of ['success', 'info', 'warn', 'danger', undefined]) expect(base).toContain(severityIcon(severity));
    });
});

// ---- references ---------------------------------------------------------------

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (name === 'node_modules' || name === 'dist') return [];
        if (statSync(path).isDirectory()) return sources(path);
        return /\.(vue|ts)$/.test(name) ? [path] : [];
    });
}

const IDENT = /^[a-z][a-zA-Z0-9]*$/;
// The string literals an expression can evaluate to — not the ones it only compares against (`p === 'full' ? …`).
const COMPARE = /(?:===|!==|==|!=)\s*$/;
const quoted = (expr: string) =>
    [...expr.matchAll(/'([^'\\]*)'/g)]
        .filter((m) => !COMPARE.test(expr.slice(0, m.index)) && !/^\s*(?:===|!==|==|!=)/.test(expr.slice(m.index + m[0].length)))
        .map((m) => m[1]!)
        .filter((v) => IDENT.test(v));

/**
 * Icon names asked for in a file: `icon="x"` and `*-icon="x"` / `*Icon="x"`
 * attributes (static values whole, bound values by their string literals), and
 * `icon: …` / `somethingIcon: …` properties in script.
 */
function referencedNames(text: string): string[] {
    const found: string[] = [];
    for (const m of text.matchAll(/(?<![\w.-])(:|v-bind:)?((?:[a-z][\w]*-)*icon|[a-z]\w*Icon)="([^"]*)"/g)) {
        const [, bound, , value] = m;
        if (bound) found.push(...quoted(value!));
        else if (IDENT.test(value!)) found.push(value!);
    }
    for (const m of text.matchAll(/(?<![\w.$-])(icon|[a-z]\w*Icon)\s*:\s*([^,}\n]+)/g)) found.push(...quoted(m[2]!));
    return found;
}

describe('icon names used in the repository', () => {
    // Attributes whose value names a field of the data, not an icon.
    const notIcons = new Set(['icon']);
    const base = new Set(baseIcons.map((def) => def.name));

    const scan = (dirs: string[]) =>
        dirs.flatMap((dir) =>
            sources(join(root, dir)).flatMap((file) =>
                referencedNames(readFileSync(file, 'utf8'))
                    .filter((name) => !notIcons.has(name))
                    .map((name) => ({ file: file.slice(root.length + 1), name }))
            )
        );

    it('finds the names it is looking for', () => {
        expect(referencedNames(`<Icon icon="search" /> <Button :icon="open ? 'x' : 'menu'" /> <X toggle-icon="plus" /> <B :icon="p === 'full' ? 'maximize' : 'sidebar'" />`)).toEqual(['search', 'x', 'menu', 'plus', 'maximize', 'sidebar']);
        expect(referencedNames(`h(Icon, { icon: node.loading ? 'spinner' : 'chevronRight' }); const d = { onIcon: 'starFill', itemIcon: 'vt-menu-item-icon' };`)).toEqual([
            'spinner',
            'chevronRight',
            'starFill'
        ]);
    });

    it('resolves every name the components use without registration', () => {
        const refs = scan(['packages/vue/src']);
        expect(refs.length).toBeGreaterThan(20);
        expect(refs.filter((ref) => !base.has(ref.name))).toEqual([]);
    });

    it('draws every name the sites and demos use', () => {
        const refs = scan(['apps']);
        expect(refs.length).toBeGreaterThan(20);
        expect(refs.filter((ref) => !(ref.name in icons))).toEqual([]);
    });
});
