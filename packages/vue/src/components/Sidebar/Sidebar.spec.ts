import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import type { MenuItem } from '../Menu/types';
import Sidebar from './Sidebar.vue';

const model = (run = vi.fn()): MenuItem[] => [
    { label: 'Dashboard', key: 'dash', icon: 'home', url: '#/dash' },
    {
        label: 'Workspace',
        items: [
            { label: 'Projects', key: 'projects', icon: 'folder', items: [{ label: 'Vitral', key: 'vitral', url: '#/vitral' }] },
            { label: 'Reports', key: 'reports', icon: 'file', command: run }
        ]
    }
];

function mountSidebar(props: Record<string, unknown> = {}, run = vi.fn()) {
    const collapsed = ref(false);
    const visible = ref(false);
    mountVt(
        defineComponent(() => () =>
            h(
                Sidebar,
                {
                    model: model(run),
                    activeKey: 'dash',
                    ...props,
                    collapsed: collapsed.value,
                    'onUpdate:collapsed': (v: boolean) => (collapsed.value = v),
                    visible: visible.value,
                    'onUpdate:visible': (v: boolean) => (visible.value = v)
                },
                { header: () => 'Acme' }
            )
        )
    );
    const nav = () => document.querySelector<HTMLElement>('nav');
    const control = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('nav a, nav button')).find((el) => el.textContent?.trim() === label)!;
    const toggle = () => document.querySelector<HTMLButtonElement>('.vt-sidebar-toggle')!;
    return { collapsed, visible, nav, control, toggle, run };
}

describe('Sidebar', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is a named navigation of links and buttons, marking the current page', () => {
        const { nav, control } = mountSidebar();
        expect(nav()!.getAttribute('aria-label')).toBe('Navigation');
        expect(control('Dashboard').tagName).toBe('A');
        expect(control('Dashboard').getAttribute('aria-current')).toBe('page');
        expect(control('Reports').tagName).toBe('BUTTON');
        const group = document.querySelector('[role="group"]')!;
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent).toBe('Workspace');
    });

    it('opens a sub-list from a button that says whether it is open, and runs commands', async () => {
        const { control, run } = mountSidebar();
        const projects = control('Projects');
        expect(projects.getAttribute('aria-expanded')).toBe('false');
        projects.click();
        await nextTick();
        expect(control('Projects').getAttribute('aria-expanded')).toBe('true');
        expect(document.getElementById(control('Projects').getAttribute('aria-controls')!)?.textContent).toContain('Vitral');
        control('Reports').click();
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('collapses to its icons through a button that says what it will do', async () => {
        const { toggle, collapsed, nav, control } = mountSidebar();
        expect(toggle().getAttribute('aria-label')).toBe('Collapse sidebar');
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
        expect(toggle().getAttribute('aria-controls')).toBe(nav()!.id);
        toggle().click();
        await nextTick();
        expect(collapsed.value).toBe(true);
        expect(toggle().getAttribute('aria-label')).toBe('Expand sidebar');
        expect(document.querySelector('.vt-sidebar-collapsed')).not.toBeNull();
        // The labels are still there for screen readers.
        expect(control('Dashboard').textContent?.trim()).toBe('Dashboard');
        control('Projects').click();
        await nextTick();
        expect(collapsed.value).toBe(false);
        expect(control('Projects').getAttribute('aria-expanded')).toBe('true');
    });

    it('leaves a strip that brings an off-canvas sidebar back', async () => {
        const { toggle, collapsed } = mountSidebar({ collapsible: 'offcanvas' });
        expect(document.querySelector('.vt-sidebar-rail')).toBeNull();
        toggle().click();
        await nextTick();
        expect(collapsed.value).toBe(true);
        expect(document.querySelector('.vt-sidebar-content')!.hasAttribute('inert')).toBe(true);
        const rail = document.querySelector<HTMLButtonElement>('.vt-sidebar-rail')!;
        expect(rail.getAttribute('aria-label')).toBe('Expand sidebar');
        expect(rail.getAttribute('aria-expanded')).toBe('false');
        await expectNoA11yViolations();
        rail.click();
        await nextTick();
        expect(collapsed.value).toBe(false);
        expect(document.querySelector('.vt-sidebar-rail')).toBeNull();
        expect(document.querySelector('.vt-sidebar-content')!.hasAttribute('inert')).toBe(false);
    });

    it('opens in a drawer on a small screen', async () => {
        vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
        const { visible, nav } = mountSidebar();
        expect(nav()).toBeNull();
        visible.value = true;
        await nextTick();
        await nextTick();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-label')).toBe('Navigation');
        expect(dialog.querySelector('nav')).not.toBeNull();
        (dialog.querySelector('.vt-sidebar-toggle') as HTMLButtonElement).click();
        await nextTick();
        expect(visible.value).toBe(false);
    });

    it('has no accessibility violations, expanded or collapsed', async () => {
        const { toggle } = mountSidebar();
        await expectNoA11yViolations();
        toggle().click();
        await nextTick();
        await expectNoA11yViolations();
    });
});
