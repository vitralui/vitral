import type { TourAlign, TourButton, TourConfig, TourSide, TourStep, TourStepContext } from './types';

/** A box on the screen, in CSS pixels. */
export interface TourRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The floating placement for a side and an alignment: `'bottom'` + `'start'` is `'bottom-start'`. `'auto'` starts from the bottom. */
export function placementOf(side: Exclude<TourSide, 'over'> = 'bottom', align: TourAlign = 'start'): string {
    const base = side === 'auto' ? 'bottom' : side;
    return align === 'center' ? base : `${base}-${align}`;
}

/** A path with its query, hash and trailing slash taken off, for comparing pages. */
export function pagePath(page: string): string {
    const path = page.split(/[?#]/)[0] ?? '';
    return path.length > 1 ? path.replace(/\/+$/, '') : path || '/';
}

/** Fills `{current}` and `{total}`, written with single braces or double. */
export function formatProgress(template: string, current: number, total: number): string {
    return template.replace(/\{\{?\s*(current|total)\s*\}?\}/g, (_, key: string) => String(key === 'current' ? current : total));
}

/** The gap around an element: its box grown by `padding` on every side. */
export function stageOf(rect: TourRect, padding: number): TourRect {
    return { x: rect.x - padding, y: rect.y - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 };
}

/**
 * The overlay as one SVG path: the whole screen, with the stage cut out of it
 * as a rounded rectangle. Drawn with the even-odd rule, the hole is not
 * painted — so it is not there for the pointer either, and a press on the
 * element reaches the element.
 */
export function overlayPath(width: number, height: number, stage: TourRect | null, radius = 0): string {
    const screen = `M0,0H${width}V${height}H0Z`;
    if (!stage || stage.width <= 0 || stage.height <= 0) return screen;
    const r = Math.max(0, Math.min(radius, stage.width / 2, stage.height / 2));
    const { x, y, width: w, height: h } = stage;
    const n = (v: number) => Math.round(v * 100) / 100;
    return (
        `${screen}M${n(x + r)},${n(y)}H${n(x + w - r)}` +
        `A${n(r)},${n(r)} 0 0 1 ${n(x + w)},${n(y + r)}V${n(y + h - r)}` +
        `A${n(r)},${n(r)} 0 0 1 ${n(x + w - r)},${n(y + h)}H${n(x + r)}` +
        `A${n(r)},${n(r)} 0 0 1 ${n(x)},${n(y + h - r)}V${n(y + r)}` +
        `A${n(r)},${n(r)} 0 0 1 ${n(x + r)},${n(y)}Z`
    );
}

/** A box part of the way from one to another, for a highlight that moves rather than jumps. */
export function tweenRect(from: TourRect, to: TourRect, t: number): TourRect {
    const k = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
    const at = (a: number, b: number) => a + (b - a) * k;
    return { x: at(from.x, to.x), y: at(from.y, to.y), width: at(from.width, to.width), height: at(from.height, to.height) };
}

const context = (steps: readonly TourStep[], index: number, direction: TourStepContext['direction']): TourStepContext => ({
    step: steps[index]!,
    index,
    total: steps.length,
    direction
});

/** Whether a step is to be shown at all: its `when` has the last word. */
export function isStepShown(steps: readonly TourStep[], index: number, direction: TourStepContext['direction'] = 0): boolean {
    const step = steps[index];
    if (!step) return false;
    return !step.when || step.when(context(steps, index, direction)) !== false;
}

/**
 * The next step to show going `direction` from `from`, passing over the ones
 * whose `when` says no; `-1` when there is none. Direction 0 is `from` itself,
 * or the first shown step after it.
 */
export function nextShownIndex(steps: readonly TourStep[], from: number, direction: -1 | 0 | 1): number {
    const step = direction === 0 ? 1 : direction;
    for (let i = direction === 0 ? from : from + direction; i >= 0 && i < steps.length; i += step) {
        if (isStepShown(steps, i, direction)) return i;
    }
    return -1;
}

/** Where a step stands among the steps that are shown: `{ current: 2, total: 4 }`. */
export function positionOf(steps: readonly TourStep[], index: number): { current: number; total: number } {
    let current = 0;
    let total = 0;
    for (let i = 0; i < steps.length; i++) {
        if (!isStepShown(steps, i)) continue;
        total++;
        if (i <= index) current = total;
    }
    return { current: Math.max(current, 1), total: Math.max(total, 1) };
}

/** A step by its place or by its `id`; `-1` when there is no such step. */
export function stepIndexOf(steps: readonly TourStep[], target: number | string): number {
    if (typeof target === 'number') return target >= 0 && target < steps.length ? target : -1;
    return steps.findIndex((s) => s.id === target);
}

/** One of a step's popover options, falling back to the tour's. */
export function optionOf<K extends keyof NonNullable<TourStep['popover']> & keyof TourConfig>(
    step: TourStep | undefined,
    config: TourConfig,
    key: K
): NonNullable<TourStep['popover']>[K] | TourConfig[K] {
    const own = step?.popover?.[key];
    return own !== undefined ? own : config[key];
}

/** The buttons a step shows, and which of them are disabled. */
export function buttonsOf(step: TourStep | undefined, config: TourConfig): { shown: Set<TourButton>; disabled: Set<TourButton> } {
    const shown = new Set<TourButton>((optionOf(step, config, 'showButtons') as TourButton[] | undefined) ?? ['next', 'previous', 'close']);
    const disabled = new Set<TourButton>((optionOf(step, config, 'disableButtons') as TourButton[] | undefined) ?? []);
    if (config.allowClose === false) shown.delete('close');
    return { shown, disabled };
}

/** What the tour stored under `storageKey`, read without trusting it. `pending` is a tour that was going to another page. */
export function readProgress(raw: string | null | undefined): { index: number; done: boolean; pending: boolean } | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as { index?: unknown; done?: unknown; pending?: unknown };
        const index = typeof value.index === 'number' && Number.isInteger(value.index) && value.index >= 0 ? value.index : 0;
        return { index, done: value.done === true, pending: value.pending === true };
    } catch {
        return null;
    }
}
