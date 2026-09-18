import { clamp } from './number';

/** The scale a slider moves along. */
export interface SliderScale {
    min: number;
    max: number;
    /** Distance between neighbouring values; 0 or less lets the slider stop anywhere. */
    step: number;
}

/** Two thumbs: the start and the end of a range, always start ≤ end. */
export type SliderRangeValue = [number, number];

// Decimal places of a number, including ones written in exponent form (1e-7).
function decimals(n: number): number {
    if (!Number.isFinite(n)) return 0;
    const [mantissa = '', exponent] = String(n).toLowerCase().split('e');
    const fraction = mantissa.split('.')[1]?.length ?? 0;
    return Math.max(0, fraction - (exponent ? Number(exponent) : 0));
}

const round = (value: number, precision: number) => Number(value.toFixed(Math.min(100, precision)));

/**
 * The nearest value on the step grid that starts at `min`, never outside the
 * scale. When `max` is off the grid (0–10 in steps of 3) the last value is the
 * last one on it (9), as with a native range input. Rounded to the precision
 * of `min` and `step`, so 0.1 steps land on 0.3 rather than 0.30000000000000004.
 */
export function snapToStep(value: number, scale: SliderScale): number {
    const { min, max, step } = scale;
    if (Number.isNaN(value)) return min;
    const bounded = clamp(value, min, max);
    if (!(step > 0)) return bounded;
    const precision = Math.max(decimals(step), decimals(min));
    let snapped = round(min + Math.round((bounded - min) / step) * step, precision);
    if (snapped > max) snapped = round(snapped - step, precision);
    return clamp(snapped, min, max);
}

/** Where a value sits along the scale, from 0 (min) to 1 (max). */
export function valueToRatio(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return clamp((value - min) / (max - min), 0, 1);
}

/** The value at a point along the scale (0 = min, 1 = max), unsnapped. */
export function ratioToValue(ratio: number, min: number, max: number): number {
    return min + clamp(ratio, 0, 1) * (max - min);
}

/**
 * The ratio a pointer is at along a track. `offset` is the pointer's distance
 * from the track's left edge (horizontal) or top edge (vertical); a vertical
 * slider has its minimum at the bottom, so its ratio runs upwards.
 */
export function pointerRatio(offset: number, length: number, vertical = false): number {
    if (!(length > 0)) return 0;
    const ratio = clamp(offset / length, 0, 1);
    return vertical ? 1 - ratio : ratio;
}

/**
 * What a key does to a thumb, or null for a key the slider does not handle.
 * The WAI-ARIA slider pattern: Right/Up one step up, Left/Down one step down,
 * Page Up/Down ten steps, Home/End to the ends. `bounds` narrows the ends,
 * which is how one thumb of a range stops at the other.
 */
export function sliderKeyValue(key: string, value: number, scale: SliderScale, bounds: readonly [number, number] = [scale.min, scale.max], pageSteps = 10): number | null {
    const step = scale.step > 0 ? scale.step : (scale.max - scale.min) / 100;
    let next: number;
    switch (key) {
        case 'ArrowRight':
        case 'ArrowUp':
            next = value + step;
            break;
        case 'ArrowLeft':
        case 'ArrowDown':
            next = value - step;
            break;
        case 'PageUp':
            next = value + step * pageSteps;
            break;
        case 'PageDown':
            next = value - step * pageSteps;
            break;
        case 'Home':
            next = bounds[0];
            break;
        case 'End':
            next = bounds[1];
            break;
        default:
            return null;
    }
    return clamp(snapToStep(next, scale), bounds[0], bounds[1]);
}

/** Puts a pair of values in order and on the scale, without snapping them. */
export function normalizeRange(values: readonly number[] | null | undefined, scale: Pick<SliderScale, 'min' | 'max'>): SliderRangeValue {
    const a = clamp(values?.[0] ?? scale.min, scale.min, scale.max);
    const b = clamp(values?.[1] ?? scale.max, scale.min, scale.max);
    return a <= b ? [a, b] : [b, a];
}

/** How far one thumb of a range may go: from the scale's end to the other thumb. */
export function thumbBounds(values: SliderRangeValue, index: 0 | 1, scale: Pick<SliderScale, 'min' | 'max'>): [number, number] {
    return index === 0 ? [scale.min, values[1]] : [values[0], scale.max];
}

/**
 * Moves one thumb of a range to `value`, snapped to the step and stopped at the
 * other thumb. Thumbs meet but never cross, so the start stays the start.
 */
export function setRangeThumb(values: SliderRangeValue, index: 0 | 1, value: number, scale: SliderScale): SliderRangeValue {
    const [lo, hi] = thumbBounds(values, index, scale);
    const next = clamp(snapToStep(value, scale), lo, hi);
    return index === 0 ? [next, values[1]] : [values[0], next];
}

/**
 * The thumb a press on the track should move: the nearer one. When the two sit
 * together, the press's side decides: below them moves the start, above them
 * the end, so a collapsed range can still be opened either way.
 */
export function nearestThumb(values: SliderRangeValue, value: number): 0 | 1 {
    const [a, b] = values;
    if (a === b) return value < a ? 0 : 1;
    return Math.abs(value - a) <= Math.abs(value - b) ? 0 : 1;
}
