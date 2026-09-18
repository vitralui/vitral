import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Button from '../Button/Button.vue';
import ButtonGroup from './ButtonGroup.vue';

describe('ButtonGroup', () => {
    it('is a named group of buttons that each keep their tab stop', async () => {
        const wrapper = mountVt(ButtonGroup, {
            attrs: { 'aria-label': 'Text alignment' },
            slots: { default: () => [h(Button, { label: 'Left' }), h(Button, { label: 'Center' }), h(Button, { label: 'Right' })] }
        });
        expect(wrapper.attributes('role')).toBe('group');
        expect(wrapper.attributes('aria-label')).toBe('Text alignment');
        expect(wrapper.findAll('button').map((b) => b.element.tabIndex)).toEqual([0, 0, 0]);
        expect(wrapper.classes()).toEqual(['vt-buttongroup']);
        await expectNoA11yViolations();
    });

    it('stacks vertically, and says so', () => {
        const wrapper = mountVt(ButtonGroup, { props: { orientation: 'vertical' }, attrs: { 'aria-label': 'Zoom' } });
        expect(wrapper.classes()).toContain('vt-buttongroup-vertical');
        expect(wrapper.attributes('aria-orientation')).toBe('vertical');
    });
});
