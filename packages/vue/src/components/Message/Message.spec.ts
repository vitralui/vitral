import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Message from './Message.vue';

describe('Message', () => {
    afterEach(() => vi.useRealTimers());

    it('is a polite status with a title and its message, and the severity icon', () => {
        const wrapper = mountVt(Message, { props: { severity: 'success', title: 'Saved' }, slots: { default: 'Your changes are live.' } });
        const region = wrapper.get('[role="status"]');
        expect(region.attributes('aria-live')).toBe('polite');
        expect(region.text()).toContain('Saved');
        expect(region.text()).toContain('Your changes are live.');
        expect(wrapper.get('.vt-message').classes()).toEqual(expect.arrayContaining(['vt-message', 'vt-message-success']));
        expect(wrapper.find('svg.vt-message-icon').attributes('aria-hidden')).toBe('true');
    });

    it('is an alert for danger and for warn', () => {
        const danger = mountVt(Message, { props: { severity: 'danger' }, slots: { default: 'Failed' } });
        expect(danger.get('[role="alert"]').attributes('aria-live')).toBe('assertive');
        const warn = mountVt(Message, { props: { severity: 'warn' }, slots: { default: 'Careful' } });
        expect(warn.find('[role="alert"]').exists()).toBe(true);
    });

    it('closes from a named button, outside the live region, and emits close', async () => {
        const wrapper = mountVt(Message, { props: { closable: true }, slots: { default: 'Heads up', action: () => h('button', 'Undo') } });
        const buttons = wrapper.findAll('button');
        const region = wrapper.get('[role="status"]').element;
        expect(buttons.every((b) => !region.contains(b.element))).toBe(true);
        await wrapper.get('button[aria-label="Close"]').trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
        expect(wrapper.find('.vt-message').exists()).toBe(false);
    });

    it('hides after its life, holding while hovered', async () => {
        vi.useFakeTimers();
        const wrapper = mountVt(Message, { props: { life: 1000 }, slots: { default: 'Brief' } });
        const root = wrapper.get('.vt-message');
        vi.advanceTimersByTime(500);
        await root.trigger('mouseenter');
        vi.advanceTimersByTime(5000);
        await nextTick();
        expect(wrapper.find('.vt-message').exists()).toBe(true);
        await root.trigger('mouseleave');
        vi.advanceTimersByTime(500);
        await nextTick();
        expect(wrapper.find('.vt-message').exists()).toBe(false);
        expect(wrapper.emitted('life-end')).toHaveLength(1);
    });

    it('draws the outlined and simple variants', () => {
        expect(mountVt(Message, { props: { variant: 'outlined' } }).get('.vt-message').classes()).toContain('vt-message-outlined');
        expect(mountVt(Message, { props: { variant: 'simple', severity: 'danger' } }).get('.vt-message').classes()).toEqual(expect.arrayContaining(['vt-message-simple', 'vt-message-danger']));
    });

    it('has no accessibility violations', async () => {
        mountVt(Message, { props: { severity: 'info', title: 'Update available', closable: true }, slots: { default: 'Restart to apply.', action: () => h('button', 'Restart') } });
        mountVt(Message, { props: { severity: 'danger', variant: 'outlined' }, slots: { default: 'Could not connect.' } });
        await expectNoA11yViolations();
    });
});
