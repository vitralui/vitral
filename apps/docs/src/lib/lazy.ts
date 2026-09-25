import { defineAsyncComponent, type Component } from 'vue';

/**
 * A page's demos, its code and its API table are fetched when the page is
 * opened, not with the site: together they are most of the library, and a
 * reader who came for the Button should not wait for the DataGrid.
 *
 * Loads in flight are counted on `window`, so the prerender (see
 * `scripts/prerender.mjs`) can tell a page that is still arriving from one
 * that is whole.
 */
declare global {
    interface Window {
        __vitralPending?: number;
    }
}

export function counted<T>(promise: Promise<T>): Promise<T> {
    if (typeof window === 'undefined') return promise;
    window.__vitralPending = (window.__vitralPending ?? 0) + 1;
    return promise.finally(() => {
        window.__vitralPending! -= 1;
    });
}

/** Loads a thing once, however many ask for it. */
export function once<T>(load: () => Promise<T>): () => Promise<T> {
    let promise: Promise<T> | null = null;
    return () => {
        promise ??= counted(load()).catch((error) => {
            // Asked again, it is tried again: a network that failed once may not twice.
            promise = null;
            throw error;
        });
        return promise;
    };
}

export interface LazyComponent {
    component: Component;
    /** Fetches the component, so it renders at once rather than a moment after the page. */
    load: () => Promise<void>;
}

/**
 * A component that is fetched the first time it is shown, or when `load` asks
 * for it earlier: the router asks before it turns the page, so the page
 * arrives whole instead of in pieces.
 */
export function lazyComponent(loader: () => Promise<{ default: Component }>): LazyComponent {
    const fetch = once(loader);
    const component = defineAsyncComponent(() => fetch().then((module) => module.default));
    // Vue resolves the wrapper through its own loader, which remembers the
    // result; going through it is what lets the first render skip the wait.
    const load = (component as { __asyncLoader?: () => Promise<unknown> }).__asyncLoader!;
    return { component, load: () => load().then(() => undefined) };
}
