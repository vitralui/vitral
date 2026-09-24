import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

// Pictures inside a carousel, a gallery or an image arrive when the network
// lets them, and without this they pop into a box that had nothing in it. Each
// `<img>` under `root` is marked while it loads (`data-vt-loading`), which the
// base stylesheet draws as the skeleton's sweep, and marked again once it has
// (`data-vt-loaded`), which fades it in.
//
// Only an image's first arrival gets the sweep. A gallery keeps one `<img>`
// and changes its `src`, and the browser goes on painting the old picture until
// the new one is there — which, without a sign, looks like a press that did
// nothing. So a picture being replaced is marked `data-vt-replacing` until its
// successor arrives, and the stylesheet dims it.

const LOADING = 'data-vt-loading';
const LOADED = 'data-vt-loaded';
const REPLACING = 'data-vt-replacing';

/** A picture already shown whose `src` just changed. */
function replaced(img: HTMLImageElement) {
    if (!img.hasAttribute(LOADED) || (img.complete && img.naturalWidth > 0)) return;
    img.setAttribute(REPLACING, '');
    const done = () => img.removeAttribute(REPLACING);
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
}

function track(img: HTMLImageElement) {
    if (img.hasAttribute(LOADED) || img.hasAttribute(LOADING)) return;
    // Already there — from the cache, or before this ran — so nothing to show.
    if (img.complete && img.naturalWidth > 0) {
        img.setAttribute(LOADED, 'instant');
        return;
    }
    img.setAttribute(LOADING, '');
    const done = () => {
        img.removeAttribute(LOADING);
        img.setAttribute(LOADED, '');
    };
    img.addEventListener('load', done, { once: true });
    // A broken image is done too: its alt text or the browser's icon shows,
    // not a sweep that never ends.
    img.addEventListener('error', done, { once: true });
}

function scan(root: Element) {
    root.querySelectorAll('img').forEach(track);
}

export function useMediaLoading(root: Ref<HTMLElement | null>) {
    let observer: MutationObserver | null = null;

    function observe(el: HTMLElement | null) {
        observer?.disconnect();
        if (!el || typeof MutationObserver === 'undefined') return;
        scan(el);
        observer = new MutationObserver((records) => {
            for (const record of records) {
                if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
                    replaced(record.target);
                    continue;
                }
                record.addedNodes.forEach((node) => {
                    if (node instanceof HTMLImageElement) track(node);
                    else if (node instanceof Element) scan(node);
                });
            }
        });
        observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    onMounted(() => {
        observe(root.value);
        watch(root, observe);
    });
    onBeforeUnmount(() => observer?.disconnect());
}
