import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Panel from './Panel.vue';

function mountPanel(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
    const collapsed = ref<boolean>((props.collapsed as boolean) ?? false);
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(
                    Panel,
                    { header: 'Details', ...props, collapsed: collapsed.value, 'onUpdate:collapsed': (v: boolean) => (collapsed.value = v) },
                    { default: () => h('p', 'The content'), ...slots }
                )
        )
    );
    const panel = wrapper.findComponent(Panel);
    const content = () => panel.get('.vt-panel-content-container').element as HTMLElement;
    return { wrapper, panel, collapsed, content };
}

describe('Panel', () => {
    it('shows a titled header and its content, with no toggle unless asked', () => {
        const { panel, content } = mountPanel();
        expect(panel.get('.vt-panel-title').text()).toBe('Details');
        expect(panel.find('button').exists()).toBe(false);
        expect(content().getAttribute('role')).toBeNull();
        expect(content().style.display).toBe('');
    });

    it('when toggleable, is a disclosure: a button that controls the region it names', () => {
        const { panel, content } = mountPanel({ toggleable: true });
        const button = panel.get('button');
        expect(button.attributes('type')).toBe('button');
        expect(button.attributes('aria-expanded')).toBe('true');
        expect(button.attributes('aria-controls')).toBe(content().id);
        expect(button.text()).toBe('Details');
        expect(content().getAttribute('role')).toBe('region');
        expect(content().getAttribute('aria-labelledby')).toBe(button.attributes('id'));
        expect(panel.get('.vt-panel-toggle-icon').attributes('aria-hidden')).toBe('true');
    });

    it('collapses and expands on the button, through v-model:collapsed', async () => {
        const { panel, collapsed, content } = mountPanel({ toggleable: true });
        const button = panel.get('button');
        await button.trigger('click');
        expect(collapsed.value).toBe(true);
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(content().style.display).toBe('none');
        expect(panel.classes()).toContain('vt-panel-collapsed');
        expect(panel.emitted('toggle')?.[0]?.[0]).toMatchObject({ value: true });

        await button.trigger('click');
        expect(collapsed.value).toBe(false);
        expect(content().style.display).toBe('');
    });

    it('starts collapsed when told to', () => {
        const { panel, content } = mountPanel({ toggleable: true, collapsed: true });
        expect(panel.get('button').attributes('aria-expanded')).toBe('false');
        expect(content().style.display).toBe('none');
    });

    it('keeps header actions outside the toggle, and names a toggle that has no header text', () => {
        const { panel } = mountPanel({ toggleable: true, header: undefined }, { icons: () => h('button', { type: 'button', 'aria-label': 'Settings' }) });
        const [toggle, action] = panel.findAll('button');
        expect(toggle!.element.contains(action!.element)).toBe(false);
        expect(action!.element.closest('.vt-panel-icons')).not.toBeNull();
        expect(toggle!.attributes('aria-label')).toBe('Collapse');
    });

    it('takes a custom toggle icon, which does not turn over', () => {
        const { panel } = mountPanel({ toggleable: true, toggleIcon: 'plus' });
        expect(panel.get('.vt-panel-toggle-icon').classes()).not.toContain('vt-panel-toggle-icon-open');
        const chevron = mountPanel({ toggleable: true }).panel;
        expect(chevron.get('.vt-panel-toggle-icon').classes()).toContain('vt-panel-toggle-icon-open');
    });

    it('has no accessibility violations, expanded or collapsed', async () => {
        const { panel } = mountPanel({ toggleable: true }, { icons: () => h('button', { type: 'button', 'aria-label': 'Refresh' }), footer: () => 'Updated today' });
        mountPanel({ header: 'Static' });
        await expectNoA11yViolations();
        await panel.get('button').trigger('click');
        await expectNoA11yViolations();
    });
});
