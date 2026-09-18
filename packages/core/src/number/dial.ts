import { clamp } from './number';
import { snapToStep, valueToRatio, type SliderScale } from './slider';

/**
 * The geometry of a knob: a dial whose value runs clockwise along an arc that
 * leaves a gap at the bottom. Angles are in degrees, clockwise from twelve
 * o'clock; the arc spans `sweep` degrees centred on the top.
 */

export const KNOB_SWEEP = 270;

/** The angle a value sits at, from `-sweep/2` (min) to `+sweep/2` (max). */
export function knobAngle(value: number, min: number, max: number, sweep = KNOB_SWEEP): number {
    return -sweep / 2 + valueToRatio(value, min, max) * sweep;
}

/** The point at `angle` on a circle of `radius` around (`cx`, `cy`), in SVG coordinates (y grows down). */
export function polarPoint(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
    const rad = (angle * Math.PI) / 180;
    const round = (n: number) => Math.round(n * 1000) / 1000;
    return { x: round(cx + radius * Math.sin(rad)), y: round(cy - radius * Math.cos(rad)) };
}

/** An SVG path along the circle from one angle to another, clockwise. Empty when they meet. */
export function arcPath(cx: number, cy: number, radius: number, from: number, to: number): string {
    if (to - from <= 0) return '';
    const start = polarPoint(cx, cy, radius, from);
    const end = polarPoint(cx, cy, radius, to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}

/**
 * The value under a pointer at (`x`, `y`) relative to the dial's centre, snapped
 * to the step. A press in the gap at the bottom goes to whichever end is nearer.
 */
export function knobValueAt(x: number, y: number, scale: SliderScale, sweep = KNOB_SWEEP): number {
    // Clockwise from twelve o'clock, in -180..180.
    const angle = (Math.atan2(x, -y) * 180) / Math.PI;
    const half = sweep / 2;
    const ratio = (clamp(angle, -half, half) + half) / sweep;
    return snapToStep(scale.min + ratio * (scale.max - scale.min), scale);
}

/**
 * What a key does to a star rating, a radio group of `stars`: Right/Up choose
 * the next star, Left/Down the previous one (swapped in right-to-left text),
 * Home/End the ends. Zero, meaning no stars, is reachable only when the rating can
 * be cleared. Null for a key the rating ignores.
 */
export function ratingKeyValue(key: string, value: number, stars: number, options: { allowZero?: boolean; rtl?: boolean } = {}): number | null {
    const low = options.allowZero ? 0 : 1;
    const forward = options.rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = options.rtl ? 'ArrowRight' : 'ArrowLeft';
    switch (key) {
        case forward:
        case 'ArrowUp':
            return value >= stars ? low : Math.max(low, value + 1);
        case backward:
        case 'ArrowDown':
            return value <= low ? stars : value - 1;
        case 'Home':
            return low;
        case 'End':
            return stars;
        default:
            return null;
    }
}
