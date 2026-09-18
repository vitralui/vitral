import { OVERLAY_HOST_ATTR, OVERLAY_SCOPE_ATTR } from '@vitral/core';
import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue';

// Where popups go. By default a component teleports its overlay to <body>;
// inside a scope — a preview wearing another theme, a panel in its own colour
// scheme — the scope hands out an element of its own, so the overlay inherits
// the scope's custom properties (and stays within it, when the element is a
// containing block). An explicit `appendTo` other than 'body' still wins.
// Components learn the element by injection; code without a component (the
// tooltip) finds it through the same data attributes, via core.

const OverlayTargetKey: InjectionKey<Ref<HTMLElement | null | undefined>> = Symbol('vt-overlay-target');

/** Makes `target` where the overlays of every component below this one are teleported. */
export function provideOverlayTarget(target: Ref<HTMLElement | null | undefined>): void {
    provide(OverlayTargetKey, target);
}

/**
 * The teleport target for a component's overlay: its own `appendTo` when that
 * names somewhere other than 'body', else the nearest scope's element, else
 * 'body'.
 */
export function useOverlayTarget(appendTo?: () => string | HTMLElement | undefined): ComputedRef<string | HTMLElement> {
    const scoped = inject(OverlayTargetKey, null);
    return computed(() => {
        const own = appendTo?.();
        if (own && own !== 'body' && own !== 'self') return own;
        return scoped?.value ?? 'body';
    });
}

/**
 * A scope for popups: renders its content and, after it, the element the
 * overlays opened inside are teleported to. Put the theme's custom properties
 * on this element (or an ancestor) and the popups wear them too.
 *
 * `contain` makes the host a containing block over the scope, so fixed popups
 * and modal masks stay inside it — what a device-sized preview wants.
 */
export const OverlayScope = defineComponent({
    name: 'VtOverlayScope',
    props: {
        as: { type: String, default: 'div' },
        contain: { type: Boolean, default: false }
    },
    setup(props, { slots }) {
        const host = ref<HTMLElement | null>(null);
        provideOverlayTarget(host);
        return () =>
            h(props.as, { [OVERLAY_SCOPE_ATTR]: '', class: 'vt-overlay-scope', style: props.contain ? { position: 'relative' } : undefined }, [
                slots.default?.(),
                h('div', {
                    ref: host,
                    [OVERLAY_HOST_ATTR]: '',
                    class: 'vt-overlay-host',
                    style: props.contain ? { position: 'absolute', inset: '0', transform: 'translateZ(0)', overflow: 'hidden', pointerEvents: 'none' } : undefined
                })
            ]);
    }
});
