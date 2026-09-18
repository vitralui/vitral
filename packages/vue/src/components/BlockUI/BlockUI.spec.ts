import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import BlockUI from './BlockUI.vue';

function mountBlock(props: Record<string, unknown> = {}) {
    const blocked = ref(false);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('button', { id: 'outside' }, 'Outside'),
            h(BlockUI, { ...props, blocked: blocked.value }, { default: () => h('button', { id: 'inside' }, 'Inside') })
        ])
    );
    const root = () => document.querySelector<HTMLElement>('.vt-blockui')!;
    const content = () => document.querySelector<HTMLElement>('.vt-blockui-content')!;
    const status = () => document.querySelector<HTMLElement>('[role="status"]');
    return { wrapper, blocked, root, content, status };
}

describe('BlockUI', () => {
    it('makes the region busy and inert, with a status on the veil', async () => {
        const { blocked, root, content, status, wrapper } = mountBlock({ label: 'Saving' });
        expect(root().hasAttribute('aria-busy')).toBe(false);
        expect(content().hasAttribute('inert')).toBe(false);
        blocked.value = true;
        await nextTick();
        expect(root().getAttribute('aria-busy')).toBe('true');
        expect(content().hasAttribute('inert')).toBe(true);
        expect(status()!.textContent?.trim()).toBe('Saving');
        expect(root().contains(status())).toBe(true);
        blocked.value = false;
        await nextTick();
        expect(content().hasAttribute('inert')).toBe(false);
        expect(wrapper.findComponent(BlockUI).emitted('block')).toHaveLength(1);
        expect(wrapper.findComponent(BlockUI).emitted('unblock')).toHaveLength(1);
    });

    it('veils the page when full screen, holding focus and the scroll, then giving both back', async () => {
        const { blocked, status } = mountBlock({ fullScreen: true });
        document.getElementById('outside')!.focus();
        blocked.value = true;
        await nextTick();
        await nextTick();
        expect(status()!.closest('.vt-blockui')).toBeNull();
        expect(document.activeElement).toBe(status());
        expect(document.body.style.overflow).toBe('hidden');
        expect(Number(status()!.style.zIndex)).toBeGreaterThanOrEqual(1100);
        blocked.value = false;
        await nextTick();
        await nextTick();
        expect(document.body.style.overflow).toBe('');
        expect(document.activeElement?.id).toBe('outside');
    });

    it('has no accessibility violations, blocked or not', async () => {
        const { blocked } = mountBlock();
        await expectNoA11yViolations();
        blocked.value = true;
        await nextTick();
        await expectNoA11yViolations();
    });
});
