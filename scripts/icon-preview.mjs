#!/usr/bin/env node
// Draws an icon in the terminal.
//
// An icon is a few dozen numbers, and the only thing that matters about them is
// what the shape looks like — which is exactly what the numbers do not tell
// you. Every other check the set has (does it parse, is it inside the 24×24
// box, is the name registered) can pass while the drawing is a scribble, and
// that is how a broken pickaxe and a bow made of crossed diagonals got in.
//
//   node scripts/icon-preview.mjs pickaxe bow bomb
//   node scripts/icon-preview.mjs --all --category=brands
//   node scripts/icon-preview.mjs --body '<circle cx="12" cy="12" r="8"/>'
//
// It samples curves and arcs into points and marks a grid, so what it shows is
// the path itself — not a font, not a guess.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ICONS = 'packages/icons/src/icons';

/** Every icon in the set, by name, with the file it came from. */
function readIcons() {
    const out = new Map();
    for (const file of readdirSync(ICONS)) {
        if (!file.endsWith('.ts') || file === 'all.ts' || file === 'index.ts') continue;
        const source = readFileSync(join(ICONS, file), 'utf8');
        for (const m of source.matchAll(/export const (\w+): IconDef = \{[\s\S]*?body: '([\s\S]*?)'\s*\}/g)) {
            out.set(m[1], { body: m[2], category: file.slice(0, -3) });
        }
    }
    return out;
}

const cubic = (p0, p1, p2, p3, n = 24) =>
    Array.from({ length: n }, (_, k) => (k + 1) / n).map((t) => [
        (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
        (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]
    ]);

const quad = (p0, p1, p2, n = 20) =>
    Array.from({ length: n }, (_, k) => (k + 1) / n).map((t) => [
        (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
    ]);

/** An elliptical arc as points, from the endpoint form SVG writes it in. */
function arc(x0, y0, rx, ry, deg, large, sweep, x1, y1, n = 36) {
    if (!rx || !ry) return [[x1, y1]];
    const rot = (deg * Math.PI) / 180;
    const dx = (x0 - x1) / 2;
    const dy = (y0 - y1) / 2;
    const xp = Math.cos(rot) * dx + Math.sin(rot) * dy;
    const yp = -Math.sin(rot) * dx + Math.cos(rot) * dy;
    let [ax, ay] = [Math.abs(rx), Math.abs(ry)];
    const lam = (xp * xp) / (ax * ax) + (yp * yp) / (ay * ay);
    if (lam > 1) {
        const s = Math.sqrt(lam);
        ax *= s;
        ay *= s;
    }
    const num = ax * ax * ay * ay - ax * ax * yp * yp - ay * ay * xp * xp;
    const den = ax * ax * yp * yp + ay * ay * xp * xp;
    const co = Math.sqrt(Math.max(0, num / den)) * (large === sweep ? -1 : 1);
    const cxp = (co * ax * yp) / ay;
    const cyp = (-co * ay * xp) / ax;
    const cx = Math.cos(rot) * cxp - Math.sin(rot) * cyp + (x0 + x1) / 2;
    const cy = Math.sin(rot) * cxp + Math.cos(rot) * cyp + (y0 + y1) / 2;
    const angle = (ux, uy, vx, vy) => {
        const d = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
        const a = Math.acos(Math.max(-1, Math.min(1, d)));
        return ux * vy - uy * vx < 0 ? -a : a;
    };
    const t1 = angle(1, 0, (xp - cxp) / ax, (yp - cyp) / ay);
    let dt = angle((xp - cxp) / ax, (yp - cyp) / ay, (-xp - cxp) / ax, (-yp - cyp) / ay);
    if (!sweep && dt > 0) dt -= 2 * Math.PI;
    if (sweep && dt < 0) dt += 2 * Math.PI;
    return Array.from({ length: n }, (_, k) => {
        const t = t1 + (dt * (k + 1)) / n;
        return [Math.cos(rot) * ax * Math.cos(t) - Math.sin(rot) * ay * Math.sin(t) + cx, Math.sin(rot) * ax * Math.cos(t) + Math.cos(rot) * ay * Math.sin(t) + cy];
    });
}

const ARGS = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

/** A path's `d` as polylines. */
function flatten(d) {
    const tokens = [...d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g)].map((m) => (m[1] ? { cmd: m[1] } : { n: Number(m[2]) }));
    const lines = [];
    let line = [];
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let prev = null;
    let cmd = null;
    let i = 0;
    while (i < tokens.length) {
        if (tokens[i].cmd) {
            cmd = tokens[i].cmd;
            i++;
            if (cmd.toUpperCase() === 'Z') {
                if (line.length) {
                    line.push([sx, sy]);
                    lines.push(line);
                    line = [[sx, sy]];
                }
                [x, y] = [sx, sy];
                continue;
            }
        }
        if (!cmd) {
            i++;
            continue;
        }
        const up = cmd.toUpperCase();
        const rel = cmd !== up;
        const need = ARGS[up];
        const nums = [];
        while (nums.length < need && i < tokens.length && tokens[i].n !== undefined) nums.push(tokens[i++].n);
        if (nums.length < need) break;
        const abs = (px, py) => (rel ? [x + px, y + py] : [px, py]);
        if (up === 'M') {
            if (line.length) lines.push(line);
            [x, y] = abs(nums[0], nums[1]);
            [sx, sy] = [x, y];
            line = [[x, y]];
            cmd = rel ? 'l' : 'L';
        } else if (up === 'L') {
            [x, y] = abs(nums[0], nums[1]);
            line.push([x, y]);
        } else if (up === 'H') {
            x = rel ? x + nums[0] : nums[0];
            line.push([x, y]);
        } else if (up === 'V') {
            y = rel ? y + nums[0] : nums[0];
            line.push([x, y]);
        } else if (up === 'C' || up === 'S') {
            const c1 = up === 'C' ? abs(nums[0], nums[1]) : prev ? [2 * x - prev[0], 2 * y - prev[1]] : [x, y];
            const c2 = up === 'C' ? abs(nums[2], nums[3]) : abs(nums[0], nums[1]);
            const end = up === 'C' ? abs(nums[4], nums[5]) : abs(nums[2], nums[3]);
            line.push(...cubic([x, y], c1, c2, end));
            prev = c2;
            [x, y] = end;
        } else if (up === 'Q' || up === 'T') {
            const c = up === 'Q' ? abs(nums[0], nums[1]) : prev ? [2 * x - prev[0], 2 * y - prev[1]] : [x, y];
            const end = up === 'Q' ? abs(nums[2], nums[3]) : abs(nums[0], nums[1]);
            line.push(...quad([x, y], c, end));
            prev = c;
            [x, y] = end;
        } else if (up === 'A') {
            const end = abs(nums[5], nums[6]);
            line.push(...arc(x, y, nums[0], nums[1], nums[2], nums[3], nums[4], end[0], end[1]));
            [x, y] = end;
        }
        // The numbers were consumed above, so `i` already points past them; a
        // run of coordinates with no command between them repeats this one.
    }
    if (line.length) lines.push(line);
    return lines;
}

/** Circles, ellipses, rects and paths, all as polylines. */
function outline(body) {
    const ring = (cx, cy, rx, ry) => Array.from({ length: 73 }, (_, k) => [cx + rx * Math.cos((k * Math.PI) / 36), cy + ry * Math.sin((k * Math.PI) / 36)]);
    const polys = [];
    for (const m of body.matchAll(/<circle[^>]*?cx="(-?[\d.]+)"[^>]*?cy="(-?[\d.]+)"[^>]*?r="(-?[\d.]+)"/g)) polys.push(ring(+m[1], +m[2], +m[3], +m[3]));
    for (const m of body.matchAll(/<ellipse[^>]*?cx="(-?[\d.]+)"[^>]*?cy="(-?[\d.]+)"[^>]*?rx="(-?[\d.]+)"[^>]*?ry="(-?[\d.]+)"/g)) polys.push(ring(+m[1], +m[2], +m[3], +m[4]));
    for (const m of body.matchAll(/<rect[^>]*?x="(-?[\d.]+)"[^>]*?y="(-?[\d.]+)"[^>]*?width="(-?[\d.]+)"[^>]*?height="(-?[\d.]+)"/g)) {
        const [x, y, w, h] = [+m[1], +m[2], +m[3], +m[4]];
        polys.push([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
    }
    for (const m of body.matchAll(/\bd="([^"]+)"/g)) polys.push(...flatten(m[1]));
    return polys;
}

/** The shape as characters, on a square grid of `size`. */
export function preview(body, size = 24) {
    const grid = Array.from({ length: size }, () => Array(size).fill(' '));
    for (const poly of outline(body)) {
        for (let k = 1; k < poly.length; k++) {
            const [x0, y0] = poly[k - 1];
            const [x1, y1] = poly[k];
            const steps = Math.max(2, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 4));
            for (let s = 0; s <= steps; s++) {
                const gx = Math.round(((x0 + ((x1 - x0) * s) / steps) * (size - 1)) / 24);
                const gy = Math.round(((y0 + ((y1 - y0) * s) / steps) * (size - 1)) / 24);
                if (gx >= 0 && gx < size && gy >= 0 && gy < size) grid[gy][gx] = '█';
            }
        }
    }
    return grid.map((row) => row.join('')).join('\n');
}

// Only when run as a command. Imported — by the spec that checks this drawing
// is right — it is just the one function above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('node scripts/icon-preview.mjs <name…> | --all [--category=x] | --body "<path …/>"');
        process.exit(0);
    }

    const size = Number(args.find((a) => a.startsWith('--size='))?.slice(7)) || 24;
    const bodyArg = args.indexOf('--body');
    if (bodyArg >= 0) {
        console.log(preview(args[bodyArg + 1] ?? '', size));
        process.exit(0);
    }

    const icons = readIcons();
    const category = args.find((a) => a.startsWith('--category='))?.slice(11);
    const names = args.includes('--all')
        ? [...icons.keys()].filter((n) => !category || icons.get(n).category === category)
        : args.filter((a) => !a.startsWith('--'));

    let missing = 0;
    for (const name of names) {
        const icon = icons.get(name);
        if (!icon) {
            console.error(`no icon called ${name}`);
            missing++;
            continue;
        }
        console.log(`\n── ${name} (${icon.category}) ──`);
        console.log(preview(icon.body, size));
    }
    process.exit(missing ? 1 : 0);
}
