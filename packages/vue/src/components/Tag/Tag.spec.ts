import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Tag from './Tag.vue';

describe('Tag', () => {
    it('shows its value with severity, shape and icon', () => {
        const wrapper = mountVt(Tag, { props: { value: 'Beta', severity: 'warn', rounded: true, icon: 'star' } });
        expect(wrapper.text()).toBe('Beta');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-tag', 'vt-tag-warn', 'vt-tag-rounded']));
        expect(wrapper.find('svg.vt-tag-icon').exists()).toBe(true);
    });

    it('names its remove button after itself', () => {
        const wrapper = mountVt(Tag, { props: { value: 'Urgent', removable: true } });
        const button = wrapper.get('button');
        expect(button.attributes('aria-label')).toBe('Remove');
        const [self, label] = button.attributes('aria-labelledby')!.split(' ');
        expect(self).toBe(button.attributes('id'));
        expect(document.getElementById(label!)?.textContent?.trim()).toBe('Urgent');
    });

    it('emits remove on a press, and on Delete or Backspace', async () => {
        const wrapper = mountVt(Tag, { props: { value: 'x', removable: true } });
        const button = wrapper.get('button');
        await button.trigger('click');
        await press(button.element, 'Delete');
        await press(button.element, 'Backspace');
        await press(button.element, 'a');
        expect(wrapper.emitted('remove')).toHaveLength(3);
    });

    it('has no accessibility violations', async () => {
        mountVt(Tag, { props: { value: 'New' } });
        mountVt(Tag, { props: { value: 'Removable', severity: 'danger', removable: true } });
        await expectNoA11yViolations();
    });
});
