// jsdom has no layout engine, so stub the few browser APIs the overlays touch.
// The server-rendering specs run in a plain Node environment with no window at
// all, so everything here waits for a document.
import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach } from 'vitest';

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

if (typeof window !== 'undefined') {
    globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

    if (!window.matchMedia) {
        window.matchMedia = (query: string) =>
            ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener() {},
                removeEventListener() {},
                addListener() {},
                removeListener() {},
                dispatchEvent: () => false
            }) as unknown as MediaQueryList;
    }

    Element.prototype.scrollIntoView ??= function scrollIntoView() {};

    enableAutoUnmount(afterEach);

    afterEach(() => {
        document.body.innerHTML = '';
    });
}
