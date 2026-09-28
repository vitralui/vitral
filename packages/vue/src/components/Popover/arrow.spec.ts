import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, withDirectives } from 'vue';
import { mountVt } from '../../../test/utils';
import { Tooltip } from '../../directives/tooltip';
import Popover from './Popover.vue';

afterEach(() => {
    document.body.innerHTML = '';
});

function mountWith(popoverProps: Record<string, unknown>, overlayArrow?: boolean) {
    const op = ref<InstanceType<typeof Popover> | null>(null);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('button', { id: 'trigger', onClick: (e: Event) => op.value?.toggle(e) }, 'Open'),
            h(Popover, { ref: op, 'aria-label': 'Panel', ...popoverProps }, { default: () => h('p', 'Inside') })
        ]),
        {},
        { theme: 'none', overlayArrow }
    );
    return { wrapper, open: async () => { document.getElementById('trigger')!.click(); await nextTick(); await nextTick(); } };
}

describe('the app-wide arrow setting', () => {
    it('gives every anchored popup an arrow, and a popup can still refuse one', async () => {
        const all = mountWith({}, true);
        await all.open();
        expect(document.querySelector('[role="dialog"] .vt-overlay-arrow')).not.toBeNull();
        all.wrapper.unmount();
        document.body.innerHTML = '';

        const refused = mountWith({ arrow: false }, true);
        await refused.open();
        expect(document.querySelector('[role="dialog"] .vt-overlay-arrow')).toBeNull();
    });

    it('reaches tooltips too', async () => {
        mountVt(defineComponent(() => () => withDirectives(h('button', { id: 'tip' }, 'Save'), [[Tooltip, { value: 'Saves the draft', arrow: true }]])));
        document.getElementById('tip')!.dispatchEvent(new Event('mouseenter'));
        document.getElementById('tip')!.dispatchEvent(new Event('focus'));
        await nextTick();
        const tip = document.querySelector('[role="tooltip"]');
        expect(tip).not.toBeNull();
        expect(tip!.querySelector('.vt-overlay-arrow')).not.toBeNull();
    });
});
