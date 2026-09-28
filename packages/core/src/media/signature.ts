/**
 * A signature's strokes as paths. A stroke is the points a pointer passed,
 * each with the pressure it was drawn with when there is one. Drawn with a
 * constant width it is a line curved through the midpoints between the
 * points, so a hand's wobble between samples does not show as corners; drawn
 * with ink that thins, it is the outline of a nib: wider where the hand
 * pressed or slowed, narrower where it hurried, and tapered at the ends if
 * asked. No DOM.
 */

/** A point, and the pressure it was drawn with (0 to 1) when it is known. */
export type SignaturePoint = [x: number, y: number] | [x: number, y: number, pressure: number];
export type SignatureStroke = SignaturePoint[];

/** How the ink behaves. Every value is optional; the defaults draw a plain line. */
export interface SignatureInk {
    /** The width at middling pressure, in the pad's units. Defaults to 2. */
    width?: number;
    /**
     * How much the pressure changes the width, 0 to 1: at 0.6 the line runs
     * from 40% to 160% of `width`. 0 is a line of one width. Defaults to 0.
     */
    thinning?: number;
    /** How much the hand's tremor is smoothed away, 0 to 1. The line lags a little more the higher it is. Defaults to 0. */
    smoothing?: number;
    /** Length over which each end narrows to a point, in the pad's units: one for both, or `[start, end]`. Defaults to 0. */
    taper?: number | [start: number, end: number];
}

const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const pressureOf = (point: SignaturePoint) => (point.length > 2 ? clamp(point[2]!, 0, 1) : 0.5);

/** A polyline as SVG path data, curved through the midpoints between its points. */
function curveThrough(points: readonly (readonly [number, number])[], move = true): string {
    const [x0, y0] = points[0]!;
    let d = `${move ? 'M' : 'L'}${round(x0)},${round(y0)}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i]!;
        const [nx, ny] = points[i + 1]!;
        d += `Q${round(x)},${round(y)} ${round((x + nx) / 2)},${round((y + ny) / 2)}`;
    }
    if (points.length > 1) {
        const [lx, ly] = points[points.length - 1]!;
        d += `L${round(lx)},${round(ly)}`;
    }
    return d;
}

/** One stroke as SVG path data, for a line of one width; a single point is a dot, drawn as a zero-length line the round cap makes round. */
export function signatureStrokePath(stroke: readonly SignaturePoint[]): string {
    if (!stroke.length) return '';
    const [x0, y0] = stroke[0]!;
    if (stroke.length === 1) return `M${round(x0)},${round(y0)}l0.01,0`;
    if (stroke.length === 2) return `M${round(x0)},${round(y0)}L${round(stroke[1]![0])},${round(stroke[1]![1])}`;
    return curveThrough(stroke.map((p) => [p[0], p[1]] as const));
}

/**
 * A stroke with the tremor taken out: each point is pulled towards the one
 * before it, as a nib dragging behind the hand would be. The last point stays
 * where the hand stopped, so the line still reaches it.
 */
export function smoothSignatureStroke(stroke: readonly SignaturePoint[], smoothing: number): SignaturePoint[] {
    const amount = clamp(smoothing, 0, 1) * 0.85;
    if (!amount || stroke.length < 3) return stroke.map((p) => [...p] as SignaturePoint);
    const out: SignaturePoint[] = [[...stroke[0]!] as SignaturePoint];
    for (let i = 1; i < stroke.length - 1; i++) {
        const [px, py] = out[i - 1]!;
        const point = stroke[i]!;
        const x = px + (point[0] - px) * (1 - amount);
        const y = py + (point[1] - py) * (1 - amount);
        out.push(point.length > 2 ? [x, y, point[2]!] : [x, y]);
    }
    out.push([...stroke[stroke.length - 1]!] as SignaturePoint);
    return out;
}

/** Whether ink draws as an outline that changes width, rather than a line of one width. */
export const signatureInkVaries = (ink: SignatureInk = {}): boolean => (ink.thinning ?? 0) > 0 || !!(Array.isArray(ink.taper) ? ink.taper[0] || ink.taper[1] : ink.taper);

/**
 * One stroke as the outline of a nib, for filling: its width follows the
 * pressure of each point and narrows over the tapers, both edges curved
 * through their midpoints and the ends rounded.
 */
export function signatureOutline(stroke: readonly SignaturePoint[], ink: SignatureInk = {}): string {
    const points = smoothSignatureStroke(stroke, ink.smoothing ?? 0);
    if (!points.length) return '';
    const width = Math.max(0.1, ink.width ?? 2);
    const thinning = clamp(ink.thinning ?? 0, 0, 1);
    const [taperStart, taperEnd] = Array.isArray(ink.taper) ? ink.taper : [ink.taper ?? 0, ink.taper ?? 0];

    // How far along each point is, for the tapers.
    const along = [0];
    for (let i = 1; i < points.length; i++) along.push(along[i - 1]! + Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]));
    const length = along[along.length - 1]!;
    const ease = (t: number) => {
        const c = clamp(t, 0, 1);
        return c * (2 - c);
    };
    const raw = points.map((point, i) => {
        let r = (width / 2) * (1 + thinning * (pressureOf(point) - 0.5) * 2);
        if (taperStart > 0) r *= Math.max(0.05, ease(along[i]! / taperStart));
        if (taperEnd > 0) r *= Math.max(0.05, ease((length - along[i]!) / taperEnd));
        return Math.max(0.05, r);
    });
    // Neighbouring radii averaged, so one odd sample is not a bump in the edge.
    const radii = raw.map((r, i) => (i === 0 || i === raw.length - 1 ? r : (raw[i - 1]! + 2 * r + raw[i + 1]!) / 4));

    if (points.length === 1 || length < 0.5) {
        const [x, y] = points[0]!;
        const r = Math.max(...radii);
        return `M${round(x - r)},${round(y)}a${round(r)},${round(r)} 0 1,0 ${round(2 * r)},0a${round(r)},${round(r)} 0 1,0 ${round(-2 * r)},0Z`;
    }

    const left: [number, number][] = [];
    const right: [number, number][] = [];
    points.forEach((point, i) => {
        const before = points[Math.max(0, i - 1)]!;
        const after = points[Math.min(points.length - 1, i + 1)]!;
        let tx = after[0] - before[0];
        let ty = after[1] - before[1];
        const size = Math.hypot(tx, ty) || 1;
        tx /= size;
        ty /= size;
        const r = radii[i]!;
        left.push([point[0] - ty * r, point[1] + tx * r]);
        right.push([point[0] + ty * r, point[1] - tx * r]);
    });
    const rEnd = round(radii[radii.length - 1]!);
    const rStart = round(radii[0]!);
    const [ex, ey] = right[right.length - 1]!;
    const [sx, sy] = left[0]!;
    // Along one edge, round the far end, back along the other, round the near end.
    return `${curveThrough(left)}A${rEnd},${rEnd} 0 0,0 ${round(ex)},${round(ey)}${curveThrough([...right].reverse(), false)}A${rStart},${rStart} 0 0,0 ${round(sx)},${round(sy)}Z`;
}

/** Drops points closer than `min` to the last one kept: a still pointer adds nothing to the line. */
export function addSignaturePoint(stroke: SignaturePoint[], point: SignaturePoint, min = 1.5): boolean {
    const last = stroke[stroke.length - 1];
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < min) return false;
    stroke.push(point);
    return true;
}

/**
 * The pressure of each point as it is drawn: a pen's own when it reports one,
 * or else one worked out from the speed — a hand slows where it presses and
 * hurries where it lifts, which is what makes a signature's line vary. The
 * speed is smoothed, so one fast sample does not pinch the line.
 */
export function createSignaturePressure(options: { usePen?: boolean } = {}) {
    let last: { x: number; y: number; t: number } | null = null;
    let speed = 0;
    return {
        /** A new stroke starts at rest. */
        start() {
            last = null;
            speed = 0;
        },
        /** The pressure at a point reached at `time` ms; `pen` is the device's own, when it is a pen. */
        at(x: number, y: number, time: number, pen?: number): number {
            const previous = last;
            last = { x, y, t: time };
            if (options.usePen !== false && pen !== undefined && pen > 0 && pen !== 0.5) return Math.round(clamp(pen, 0, 1) * 100) / 100;
            if (!previous) return 0.5;
            const dt = Math.max(1, time - previous.t);
            speed = speed * 0.7 + (Math.hypot(x - previous.x, y - previous.y) / dt) * 0.3;
            // Units per millisecond: a slow hand (0.1) presses hard, a quick one (2) barely.
            return Math.round(clamp(1 / (1 + speed * 2), 0, 1) * 100) / 100;
        }
    };
}

/** The whole signature as a standalone SVG document, for saving or sending. */
export function signatureSVG(
    strokes: readonly SignatureStroke[],
    options: { width: number; height: number; color?: string; strokeWidth?: number; background?: string; ink?: Omit<SignatureInk, 'width'> }
): string {
    const { width, height, color = '#000', strokeWidth = 2, background } = options;
    const ink: SignatureInk = { ...options.ink, width: strokeWidth };
    const drawn = strokes.filter((s) => s.length);
    const fill = background ? `<rect width="100%" height="100%" fill="${background}"/>` : '';
    const body = signatureInkVaries(ink)
        ? `<g fill="${color}" stroke="none">${drawn.map((s) => `<path d="${signatureOutline(s, ink)}"/>`).join('')}</g>`
        : `<g fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${drawn
              .map((s) => `<path d="${signatureStrokePath(smoothSignatureStroke(s, ink.smoothing ?? 0))}"/>`)
              .join('')}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${fill}${body}</svg>`;
}
