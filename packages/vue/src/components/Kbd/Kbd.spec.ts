import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Kbd from './Kbd.vue';

describe('Kbd', () => {
    it('draws one nested key a cap, with a plus between them off a Mac', () => {
        const wrapper = mountVt(Kbd, { props: { keys: 'mod+shift+p', platform: 'other' } });
        expect(wrapper.element.tagName).toBe('KBD');
        expect(wrapper.findAll('kbd.vt-kbd-key').map((k) => k.text())).toEqual(['Ctrl', 'Shift', 'P']);
        expect(wrapper.findAll('.vt-kbd-separator')).toHaveLength(2);
    });

    it('draws a Mac\'s symbols run together, each still named for a screen reader', () => {
        const wrapper = mountVt(Kbd, { props: { keys: ['mod', 'k'], platform: 'mac' } });
        const [command] = wrapper.findAll('kbd.vt-kbd-key');
        expect(command!.get('[aria-hidden="true"]').text()).toBe('⌘');
        expect(command!.get('.vt-sr-only').text()).toBe('Command');
        expect(wrapper.find('.vt-kbd-separator').exists()).toBe(false);
    });

    it('takes one key from its slot, a separator and a size', () => {
        const slot = mountVt(Kbd, { slots: { default: 'Esc' }, props: { size: 'small' } });
        expect(slot.get('kbd.vt-kbd-key').text()).toBe('Esc');
        expect(slot.classes()).toContain('vt-kbd-sm');
        const then = mountVt(Kbd, { props: { keys: ['g', 'i'], separator: 'then', platform: 'other' } });
        expect(then.get('.vt-kbd-separator').text()).toBe('then');
    });

    it('has no accessibility violations', async () => {
        mountVt(Kbd, { props: { keys: 'mod+k', platform: 'mac' } });
        mountVt(Kbd, { props: { keys: 'ctrl+c', platform: 'other' } });
        await expectNoA11yViolations();
    });
});
