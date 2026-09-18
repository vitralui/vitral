import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Chip from './Chip.vue';

describe('Chip', () => {
    it('shows its label, with an icon or an image before it', () => {
        expect(mountVt(Chip, { props: { label: 'Vue' } }).text()).toBe('Vue');
        expect(mountVt(Chip, { props: { label: 'Vue', icon: 'star' } }).find('svg.vt-chip-icon').exists()).toBe(true);
        expect(mountVt(Chip, { props: { label: 'Ana', image: '/ana.png' } }).get('img').attributes('alt')).toBe('');
    });

    it('names its remove button after itself', () => {
        const wrapper = mountVt(Chip, { props: { label: 'TypeScript', removable: true } });
        const button = wrapper.get('button');
        expect(button.attributes('aria-label')).toBe('Remove');
        const [self, label] = button.attributes('aria-labelledby')!.split(' ');
        expect(self).toBe(button.attributes('id'));
        expect(document.getElementById(label!)?.textContent?.trim()).toBe('TypeScript');
    });

    it('emits remove on a press, and on Delete or Backspace', async () => {
        const wrapper = mountVt(Chip, { props: { label: 'x', removable: true } });
        const button = wrapper.get('button');
        await button.trigger('click');
        await press(button.element, 'Delete');
        await press(button.element, 'Backspace');
        await press(button.element, 'a');
        expect(wrapper.emitted('remove')).toHaveLength(3);
    });

    it('has no accessibility violations', async () => {
        mountVt(Chip, { props: { label: 'Vue' } });
        mountVt(Chip, { props: { label: 'Removable', removable: true } });
        await expectNoA11yViolations();
    });
});
