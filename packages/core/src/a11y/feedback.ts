/** The severities a message, toast, tag or badge can carry. */
export type FeedbackSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';

export type LiveRegionAttrs = {
    role: 'alert' | 'status';
    'aria-live': 'assertive' | 'polite';
    'aria-atomic': 'true';
};

/**
 * How a message is announced. Most go in a polite `status` region, read when
 * the user is idle; the severities listed in `urgent` interrupt as an `alert`.
 * A toast interrupts only for `danger`; an inline message also for `warn`.
 */
export function liveRegion(severity: string | undefined, urgent: readonly string[] = ['danger']): LiveRegionAttrs {
    const alert = !!severity && urgent.includes(severity);
    return { role: alert ? 'alert' : 'status', 'aria-live': alert ? 'assertive' : 'polite', 'aria-atomic': 'true' };
}

/** The built-in icon that stands for a severity. */
export function severityIcon(severity: string | undefined): string {
    switch (severity) {
        case 'success':
            return 'success';
        case 'warn':
            return 'warning';
        case 'danger':
            return 'error';
        default:
            return 'info';
    }
}

/**
 * Hides text from sight but not from assistive technology. An inline style
 * rather than a class, so it holds in unstyled mode too. Text meant only for a
 * screen reader must never appear because a stylesheet was left out.
 */
export const visuallyHidden = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
} as const;

/** Where `value` falls between `min` and `max`, as a percentage clamped to 0–100. */
export function toPercent(value: number, min = 0, max = 100): number {
    if (!Number.isFinite(value) || max <= min) return 0;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
