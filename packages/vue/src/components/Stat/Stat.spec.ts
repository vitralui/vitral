import { ptBR } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Stat from './Stat.vue';

describe('Stat', () => {
    it('formats its figure for the locale, with a prefix and a suffix', () => {
        const wrapper = mountVt(Stat, { props: { label: 'Revenue', value: 12345.6, format: { maximumFractionDigits: 0 }, prefix: '$', suffix: '/mo' } });
        expect(wrapper.get('.vt-stat-label').text()).toBe('Revenue');
        expect(wrapper.get('.vt-stat-value').text()).toBe('$12,346/mo');
        const br = mountVt(Stat, { props: { value: 1234.5 } }, { theme: 'none', locale: ptBR });
        expect(br.get('.vt-stat-value').text()).toBe('1.234,5');
    });

    it('says which way it went in words, and colours it by whether that is good', () => {
        const up = mountVt(Stat, { props: { value: 10, delta: 0.125 } });
        expect(up.get('.vt-stat-delta').text()).toContain('+12.5%');
        expect(up.get('.vt-stat-delta .vt-sr-only').text()).toBe('Up 12.5%');
        expect(up.get('.vt-stat-delta').classes()).toContain('vt-stat-delta-good');

        const costs = mountVt(Stat, { props: { value: 10, delta: -0.04, invert: true } });
        expect(costs.get('.vt-stat-delta .vt-sr-only').text()).toBe('Down 4%');
        expect(costs.get('.vt-stat-delta').classes()).toContain('vt-stat-delta-good');

        const text = mountVt(Stat, { props: { value: 10, delta: '3 more', trend: 'up', invert: true } });
        expect(text.get('.vt-stat-delta').classes()).toContain('vt-stat-delta-bad');
    });

    it('keeps its place while loading', () => {
        const wrapper = mountVt(Stat, { props: { label: 'Users', value: 5, delta: 0.1, loading: true } });
        expect(wrapper.attributes('aria-busy')).toBe('true');
        expect(wrapper.find('.vt-stat-placeholder').exists()).toBe(true);
        expect(wrapper.find('.vt-stat-delta').exists()).toBe(false);
    });

    it('has no accessibility violations', async () => {
        mountVt(Stat, { props: { label: 'Orders', value: 1520, delta: -0.02, caption: 'vs last week', icon: 'star' } });
        await expectNoA11yViolations();
    });
});
