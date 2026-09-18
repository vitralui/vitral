import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import SplitView from './SplitView.vue';
import type { SplitViewSlotProps } from './types';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountSplitView(initial: Record<string, unknown> = {}) {
    const { open: startOpen, ...rest } = initial;
    const open = ref(Boolean(startOpen));
    const props = reactive<Record<string, unknown>>({ paneLabel: 'Navigation', ...rest });
    const seen: SplitViewSlotProps[] = [];
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('button', { id: 'outside', type: 'button' }, 'Outside'),
            h(
                SplitView,
                { ...props, open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
                {
                    pane: (slot: SplitViewSlotProps) => {
                        seen.push(slot);
                        return [h('button', { id: 'pane-first', type: 'button', onClick: slot.toggle }, 'Menu'), h('a', { href: '#home' }, 'Home')];
                    },
                    default: (slot: SplitViewSlotProps) => [
                        h('button', { id: 'toggle', type: 'button', 'aria-controls': slot.paneId, 'aria-expanded': String(slot.open), onClick: slot.toggle }, 'Toggle'),
                        h('p', 'Content')
                    ]
                }
            )
        ])
    );
    const pane = () => document.querySelector('aside')!;
    const content = () => document.querySelector<HTMLElement>('.vt-splitview-content')!;
    const root = () => document.querySelector<HTMLElement>('.vt-splitview')!;
    const toggle = () => document.getElementById('toggle')!;
    const last = () => seen[seen.length - 1]!;
    return { wrapper, open, props, pane, content, root, toggle, last };
}

const pressOn = async (el: Element) => {
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
};

describe('SplitView', () => {
    it('is a complementary landmark named by paneLabel, out of reach while closed', () => {
        const { pane, toggle } = mountSplitView();
        expect(pane().tagName).toBe('ASIDE');
        expect(pane().getAttribute('aria-label')).toBe('Navigation');
        expect(toggle().getAttribute('aria-controls')).toBe(pane().id);
        expect(pane().hasAttribute('inert')).toBe(true);
        expect(pane().style.visibility).toBe('hidden');
        expect(pane().style.width).toBe('0px');
    });

    it('overlay: floats the open pane, moves focus into it, and closes on Escape with focus returned', async () => {
        const { open, pane, content, toggle } = mountSplitView();
        toggle().focus();
        toggle().click();
        await tick();
        expect(open.value).toBe(true);
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
        expect(pane().hasAttribute('inert')).toBe(false);
        expect(pane().style.visibility).toBe('');
        expect(pane().style.position).toBe('absolute');
        expect(pane().style.width).toBe('320px');
        expect(content().style.marginInlineStart).toBe('');
        expect(document.activeElement?.id).toBe('pane-first');

        await press(document.activeElement!, 'Escape');
        expect(open.value).toBe(false);
        expect(document.activeElement).toBe(toggle());
    });

    it('overlay: a press outside dismisses it; a press inside or on its toggle does not', async () => {
        const { open } = mountSplitView({ open: true });
        await tick();
        await pressOn(document.getElementById('toggle')!);
        expect(open.value).toBe(true);
        await pressOn(document.querySelector('aside a')!);
        expect(open.value).toBe(true);
        await pressOn(document.getElementById('outside')!);
        expect(open.value).toBe(false);
    });

    it('inline: pushes the content aside, and neither light-dismisses nor takes focus', async () => {
        const { open, pane, toggle } = mountSplitView({ displayMode: 'inline' });
        toggle().focus();
        toggle().click();
        await tick();
        expect(pane().style.position).toBe('');
        expect(pane().style.width).toBe('320px');
        expect(document.activeElement).toBe(toggle());
        await press(toggle(), 'Escape');
        await pressOn(document.getElementById('outside')!);
        expect(open.value).toBe(true);
    });

    it('compact modes keep a strip, in reach, and tell the slots it is compact', async () => {
        const { props, pane, content, last } = mountSplitView({ displayMode: 'compactInline', compactPaneLength: 56 });
        expect(pane().style.width).toBe('56px');
        expect(pane().hasAttribute('inert')).toBe(false);
        expect(pane().style.visibility).toBe('');
        expect(pane().style.position).toBe('');
        expect(last().compact).toBe(true);

        props.displayMode = 'compactOverlay';
        await nextTick();
        expect(content().style.marginInlineStart).toBe('56px');
        expect(pane().style.position).toBe('absolute');
    });

    it('compactOverlay: the open pane grows over the strip and closes back to it', async () => {
        const { open, pane, last } = mountSplitView({ displayMode: 'compactOverlay', openPaneLength: '18rem' });
        const first = document.getElementById('pane-first')!;
        first.focus();
        first.click();
        await tick();
        expect(open.value).toBe(true);
        expect(pane().style.width).toBe('18rem');
        expect(last().compact).toBe(false);
        await press(document.activeElement!, 'Escape');
        expect(open.value).toBe(false);
        expect(pane().style.width).toBe('48px');
        expect(document.activeElement).toBe(first);
    });

    it('puts the pane on the end side with placement right', async () => {
        const { props, root, pane, content } = mountSplitView({ placement: 'right', displayMode: 'inline' });
        expect(root().style.flexDirection).toBe('row-reverse');
        expect(root().classList).toContain('vt-splitview-right');
        props.displayMode = 'compactOverlay';
        await nextTick();
        expect(pane().style.insetInlineEnd).toMatch(/^0(px)?$/);
        expect(pane().style.insetInlineStart).toBe('');
        expect(content().style.marginInlineEnd).toBe('48px');
    });

    it('has no accessibility violations, closed or open', async () => {
        const { toggle } = mountSplitView({ displayMode: 'compactOverlay' });
        await expectNoA11yViolations();
        toggle().click();
        await tick();
        await expectNoA11yViolations();
    });
});
