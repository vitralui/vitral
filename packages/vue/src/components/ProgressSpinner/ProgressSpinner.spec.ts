import { ptBR } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import ProgressSpinner from './ProgressSpinner.vue';

describe('ProgressSpinner', () => {
    it('is an indeterminate progressbar named from the locale', () => {
        const wrapper = mountVt(ProgressSpinner);
        expect(wrapper.attributes('role')).toBe('progressbar');
        expect(wrapper.attributes('aria-label')).toBe('Loading…');
        expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
        expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
        const pt = mountVt(ProgressSpinner, {}, { theme: 'none', locale: ptBR });
        expect(pt.attributes('aria-label')).toBe('Carregando…');
    });

    it('takes a name of its own', () => {
        expect(mountVt(ProgressSpinner, { attrs: { 'aria-label': 'Fetching' } }).attributes('aria-label')).toBe('Fetching');
        const labelled = mountVt(ProgressSpinner, { attrs: { 'aria-labelledby': 'x' } });
        expect(labelled.attributes('aria-label')).toBeUndefined();
    });

    it('fills a determinate ring from its value', () => {
        const wrapper = mountVt(ProgressSpinner, { props: { value: 62.4 } });
        expect(wrapper.attributes()).toMatchObject({ 'aria-valuenow': '62', 'aria-valuemin': '0', 'aria-valuemax': '100' });
        expect(wrapper.classes()).toContain('vt-progressspinner-determinate');
        expect(wrapper.attributes('style')).toContain('--_value: 62.4');
        expect(wrapper.findAll('circle')).toHaveLength(2);
    });

    it('sizes itself and its stroke', () => {
        const wrapper = mountVt(ProgressSpinner, { props: { size: 48, strokeWidth: 4, animationDuration: '1s' } });
        expect(wrapper.attributes('style')).toContain('width: 48px');
        expect(wrapper.attributes('style')).toContain('--vt-progressspinner-animation-duration: 1s');
        expect(wrapper.get('circle').attributes()).toMatchObject({ r: '14', 'stroke-width': '4' });
    });

    it('has no accessibility violations', async () => {
        mountVt(ProgressSpinner);
        mountVt(ProgressSpinner, { props: { value: 40 }, attrs: { 'aria-label': 'Installing' } });
        await expectNoA11yViolations();
    });
});
