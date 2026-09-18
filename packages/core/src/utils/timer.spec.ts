import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTimer } from './timer';

describe('createTimer', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('fires once its duration has passed', () => {
        const done = vi.fn();
        createTimer(done, 1000).start();
        vi.advanceTimersByTime(999);
        expect(done).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(done).toHaveBeenCalledTimes(1);
    });

    it('keeps its place while paused, for as long as any reason holds it', () => {
        const done = vi.fn();
        const timer = createTimer(done, 1000);
        timer.start();
        vi.advanceTimersByTime(600);
        timer.pause('hover');
        timer.pause('focus');
        expect(timer.paused).toBe(true);
        expect(timer.remaining).toBe(400);
        vi.advanceTimersByTime(5000);
        timer.resume('hover');
        vi.advanceTimersByTime(5000);
        expect(done).not.toHaveBeenCalled();
        timer.resume('focus');
        vi.advanceTimersByTime(399);
        expect(done).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(done).toHaveBeenCalledTimes(1);
    });

    it('restarts from the full duration, and stops without firing', () => {
        const done = vi.fn();
        const timer = createTimer(done, 1000);
        timer.start();
        vi.advanceTimersByTime(800);
        timer.start();
        vi.advanceTimersByTime(800);
        expect(done).not.toHaveBeenCalled();
        timer.stop();
        vi.advanceTimersByTime(5000);
        expect(done).not.toHaveBeenCalled();
    });

    it('does not run before it is started, even when resumed', () => {
        const done = vi.fn();
        const timer = createTimer(done, 100);
        timer.resume();
        vi.advanceTimersByTime(500);
        expect(done).not.toHaveBeenCalled();
    });
});
