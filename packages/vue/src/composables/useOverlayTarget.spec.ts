import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mountVt } from '../../test/utils';
import Dialog from '../components/Dialog/Dialog.vue';
import Select from '../components/Select/Select.vue';
import { OverlayScope } from './useOverlayTarget';

const settle = async () => {
    await nextTick();
    await nextTick();
};

describe('OverlayScope', () => {
    it('sends the popups opened inside it to its own host, and leaves the others at the body', async () => {
        mountVt(
            defineComponent(() => () => [
                h(OverlayScope, { contain: true, style: '--vt-primary-color: rebeccapurple', id: 'scope' }, () => [
                    h(Select, { id: 'inside', options: ['One', 'Two'], ariaLabel: 'Inside' }),
                    h(Dialog, { visible: true, header: 'Scoped' }, () => 'Hello')
                ]),
                h(Select, { id: 'outside', options: ['Three'], ariaLabel: 'Outside' })
            ])
        );
        await settle();
        const host = document.querySelector('#scope > [data-vt-overlay-host]')!;
        expect(host).not.toBeNull();
        // The dialog was open from the start: it moved into the host once the host existed.
        expect(host.querySelector('[role="dialog"]')).not.toBeNull();

        (document.querySelector('#inside') as HTMLElement).click();
        await settle();
        expect(host.querySelector('[role="listbox"]')).not.toBeNull();

        (document.querySelector('#outside') as HTMLElement).click();
        await settle();
        const listboxes = Array.from(document.querySelectorAll('[role="listbox"]'));
        expect(listboxes.some((el) => !host.contains(el) && el.textContent?.includes('Three'))).toBe(true);
    });

    it('keeps an explicit appendTo inside a scope', async () => {
        const target = document.createElement('div');
        target.id = 'elsewhere';
        document.body.appendChild(target);
        mountVt(
            defineComponent(() => () => h(OverlayScope, { id: 'scope' }, () => [h(Dialog, { visible: true, header: 'Elsewhere', appendTo: '#elsewhere' }, () => 'Hi')]))
        );
        await settle();
        expect(target.querySelector('[role="dialog"]')).not.toBeNull();
    });
});
