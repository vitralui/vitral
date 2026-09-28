import { ptBR } from '@vitral/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Countdown from './Countdown.vue';

const start = new Date(2026, 8, 28, 12, 0, 0).getTime();
beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
});
afterEach(() => vi.useRealTimers());

describe('Countdown', () => {
    it('shows what is left in tiles, and says it in words', () => {
        const to = start + ((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000;
        const wrapper = mountVt(Countdown, { props: { to } });
        expect(wrapper.findAll('.vt-countdown-value').map((v) => v.text())).toEqual(['1', '02', '03', '04']);
        expect(wrapper.findAll('.vt-countdown-label').map((v) => v.text())).toEqual(['day', 'hours', 'minutes', 'seconds']);
        expect(wrapper.attributes('role')).toBe('timer');
        expect(wrapper.attributes('aria-label')).toBe('1 day, 2 hours, 3 minutes, 4 seconds');
    });

    it('leaves out leading zeros, ticks every second, and says when it ends', async () => {
        const wrapper = mountVt(Countdown, { props: { to: start + 3000, units: ['minutes', 'seconds'] } });
        expect(wrapper.findAll('.vt-countdown-value').map((v) => v.text())).toEqual(['03']);
        await vi.advanceTimersByTimeAsync(1000);
        expect(wrapper.find('.vt-countdown-value').text()).toBe('02');
        await vi.advanceTimersByTimeAsync(3000);
        expect(wrapper.emitted('end')).toHaveLength(1);
        expect(wrapper.classes()).toContain('vt-countdown-done');
    });

    it('speaks the locale, as a line of words when asked', async () => {
        const wrapper = mountVt(Countdown, { props: { to: start + 2 * 3600 * 1000, variant: 'text', units: ['hours', 'minutes'] } }, { theme: 'none', locale: ptBR });
        await nextTick();
        expect(wrapper.text()).toBe('2 horas, 0 minuto');
    });

    it('has no accessibility violations', async () => {
        // axe waits on real timers.
        vi.useRealTimers();
        mountVt(Countdown, { props: { to: Date.now() + 90_000 } });
        await expectNoA11yViolations();
    });
});
