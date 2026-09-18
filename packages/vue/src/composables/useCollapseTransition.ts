/**
 * Hooks for a `<Transition>` that opens and closes an element's height: a
 * panel's body, an accordion section. CSS cannot animate to `height: auto`, so
 * these hand the browser the two measured heights to move between; the
 * duration, the easing and the reduced-motion switch stay in the stylesheet,
 * on the transition's `-enter-active` / `-leave-active` classes. Without such
 * CSS (unstyled, or reduced motion) the transition simply ends at once.
 *
 * Every hook takes only the element, so Vue waits for the CSS transition to
 * end rather than for a callback.
 */
export function useCollapseTransition() {
    const setHeight = (el: Element, height: string) => {
        (el as HTMLElement).style.height = height;
    };
    const reflow = (el: Element) => void (el as HTMLElement).offsetHeight;
    return {
        onBeforeEnter: (el: Element) => setHeight(el, '0px'),
        onEnter: (el: Element) => {
            reflow(el);
            setHeight(el, `${el.scrollHeight}px`);
        },
        onAfterEnter: (el: Element) => setHeight(el, ''),
        onEnterCancelled: (el: Element) => setHeight(el, ''),
        onBeforeLeave: (el: Element) => setHeight(el, `${el.scrollHeight}px`),
        onLeave: (el: Element) => {
            reflow(el);
            setHeight(el, '0px');
        },
        onAfterLeave: (el: Element) => setHeight(el, ''),
        onLeaveCancelled: (el: Element) => setHeight(el, '')
    };
}
