import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Card from './Card.vue';

describe('Card', () => {
    it('lays out title, subtitle, content and footer in their parts', () => {
        const wrapper = mountVt(Card, {
            props: { title: 'Invoice', subtitle: 'Due in 3 days' },
            slots: { default: () => h('p', 'Body'), footer: () => h('button', { type: 'button' }, 'Pay') }
        });
        expect(wrapper.classes()).toContain('vt-card');
        expect(wrapper.get('.vt-card-title').text()).toBe('Invoice');
        expect(wrapper.get('.vt-card-subtitle').text()).toBe('Due in 3 days');
        expect(wrapper.get('.vt-card-content').text()).toBe('Body');
        expect(wrapper.get('.vt-card-footer button').text()).toBe('Pay');
        expect(wrapper.find('.vt-card-header').exists()).toBe(false);
    });

    it('lets slots replace the title and add a header, and renders nothing it was not given', () => {
        const wrapper = mountVt(Card, { slots: { title: () => h('h2', 'Custom'), header: () => h('img', { alt: 'Cover', src: 'data:,' }) } });
        expect(wrapper.get('.vt-card-title h2').text()).toBe('Custom');
        expect(wrapper.find('.vt-card-header img').exists()).toBe(true);
        expect(wrapper.find('.vt-card-subtitle').exists()).toBe(false);
        expect(wrapper.find('.vt-card-footer').exists()).toBe(false);
    });

    it('takes pass-through and can drop its classes', () => {
        const wrapper = mountVt(Card, { props: { title: 'A', unstyled: true, pt: { title: 'mine' } } });
        expect(wrapper.classes()).toEqual([]);
        expect(wrapper.get('.mine').text()).toBe('A');
    });

    it('has no accessibility violations', async () => {
        mountVt(Card, { props: { title: 'Plan', subtitle: 'Monthly' }, slots: { default: () => 'Details', footer: () => h('button', { type: 'button' }, 'Choose') } });
        await expectNoA11yViolations();
    });
});
