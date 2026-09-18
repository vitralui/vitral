import { mount } from '@vue/test-utils';
import { Vitral } from '../src/plugin';
import type { VitralOptions } from '../src/config/config';

/**
 * Mounts into the document (overlays teleport to `<body>`, and axe needs a real
 * tree) with the plugin installed and no theme, which keeps specs fast.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountVt(component: any, options: any = {}, vitral: VitralOptions = { theme: 'none' }) {
    return mount(component, {
        attachTo: document.body,
        ...options,
        global: { ...options.global, plugins: [[Vitral, vitral], ...(options.global?.plugins ?? [])] }
    });
}

/** Presses a key on an element, bubbling to the document the way a real keystroke does. */
export async function press(el: Element, key: string, init: KeyboardEventInit = {}): Promise<void> {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true, ...init }));
    await new Promise((resolve) => setTimeout(resolve, 0));
}
