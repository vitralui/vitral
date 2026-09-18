import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Button from './Button.vue';

describe('Button', () => {
    it('renders its label with the severity and variant classes', () => {
        const wrapper = mountVt(Button, { props: { label: 'Save', severity: 'danger', variant: 'outlined', size: 'small' } });
        const root = wrapper.get('button');
        expect(root.text()).toBe('Save');
        expect(root.classes()).toEqual(expect.arrayContaining(['vt-button', 'vt-button-danger', 'vt-button-outlined', 'vt-button-sm']));
        expect(root.attributes('type')).toBe('button');
    });

    it('treats a button with only an icon as icon-only, named by aria-label', () => {
        const wrapper = mountVt(Button, { props: { icon: 'plus' }, attrs: { 'aria-label': 'Add' } });
        expect(wrapper.classes()).toContain('vt-button-icon-only');
        expect(wrapper.attributes('aria-label')).toBe('Add');
        expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    });

    it('disables itself and announces busy while loading', async () => {
        const wrapper = mountVt(Button, { props: { label: 'Send', loading: true } });
        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.attributes('aria-busy')).toBe('true');
        expect(wrapper.find('.vt-icon-spin').exists()).toBe(true);
    });

    it('emits click, and not while disabled', async () => {
        const onClick = vi.fn();
        const wrapper = mountVt(Button, { props: { label: 'Go' }, attrs: { onClick } });
        await wrapper.trigger('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        await wrapper.setProps({ disabled: true });
        await wrapper.trigger('click');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders as a link that is announced disabled and leaves the tab order', () => {
        const wrapper = mountVt(Button, { props: { as: 'a', label: 'Docs', disabled: true }, attrs: { href: '/docs' } });
        expect(wrapper.element.tagName).toBe('A');
        expect(wrapper.attributes('aria-disabled')).toBe('true');
        expect(wrapper.attributes('tabindex')).toBe('-1');
    });

    it('takes pass-through, per-instance tokens, and can drop its classes', () => {
        const styled = mountVt(Button, { props: { label: 'A', pt: { root: 'extra', label: { 'data-x': '1' } }, dt: { button: { borderRadius: '0' } } } });
        expect(styled.classes()).toEqual(expect.arrayContaining(['vt-button', 'extra']));
        expect(styled.get('span').attributes('data-x')).toBe('1');
        expect(styled.attributes('style')).toContain('--vt-button-border-radius: 0');

        const bare = mountVt(Button, { props: { label: 'B', unstyled: true, pt: { root: 'mine' } } });
        expect(bare.classes()).toEqual(['mine']);
    });

    it('has no accessibility violations', async () => {
        mountVt(Button, { props: { label: 'Save' } });
        mountVt(Button, { props: { icon: 'trash' }, attrs: { 'aria-label': 'Delete' } });
        await expectNoA11yViolations();
    });
});
