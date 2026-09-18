export interface Timer {
    /** Starts, or restarts, the countdown from `duration` (the one given at creation by default). */
    start(duration?: number): void;
    /**
     * Holds the countdown for a reason (`'hover'`, `'focus'`), keeping the time
     * left. Several reasons can hold it at once; it runs again once all are gone.
     */
    pause(reason?: string): void;
    resume(reason?: string): void;
    /** Cancels it; nothing fires. */
    stop(): void;
    /** Milliseconds left before it fires. */
    readonly remaining: number;
    readonly paused: boolean;
}

/**
 * A countdown that can be paused and resumed without losing its place, which a
 * toast or a message with a `life` needs to honour WCAG 2.2.1: the time runs
 * only while nobody is reading it (hovered) or working in it (focused).
 */
export function createTimer(callback: () => void, duration: number): Timer {
    let remaining = duration;
    let startedAt = 0;
    let handle: ReturnType<typeof setTimeout> | undefined;
    let active = false;
    const holds = new Set<string>();

    const fire = () => {
        handle = undefined;
        active = false;
        callback();
    };
    const run = () => {
        if (!active || holds.size > 0 || handle !== undefined) return;
        startedAt = Date.now();
        handle = setTimeout(fire, Math.max(0, remaining));
    };
    const halt = () => {
        if (handle === undefined) return;
        clearTimeout(handle);
        handle = undefined;
        remaining -= Date.now() - startedAt;
    };

    return {
        start(ms = duration) {
            halt();
            remaining = ms;
            active = true;
            run();
        },
        pause(reason = 'pause') {
            holds.add(reason);
            halt();
        },
        resume(reason = 'pause') {
            holds.delete(reason);
            run();
        },
        stop() {
            halt();
            active = false;
        },
        get remaining() {
            return Math.max(0, handle === undefined ? remaining : remaining - (Date.now() - startedAt));
        },
        get paused() {
            return holds.size > 0;
        }
    };
}
