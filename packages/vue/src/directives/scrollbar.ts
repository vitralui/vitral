import { scrollbars, type ScrollbarPart, type ScrollbarPartState, type Scrollbars } from '@vitral/dom';
import { baseStyle, classOf, scrollpanelStyle } from '@vitral/styles';
import type { Directive, DirectiveBinding, VNode } from 'vue';
import { directiveContext } from '../base/directiveContext';
import type { PassThroughValue, ScrollbarMode } from '../base/types';
import { loadStyle } from '../composables/useStyle';
import type { VitralContext } from '../config/config';

export type ScrollbarDirectiveValue = ScrollbarMode | null | undefined;

const handles = new WeakMap<HTMLElement, { bars: Scrollbars; mode: ScrollbarMode; arrows: boolean }>();

function modeOf(binding: DirectiveBinding<ScrollbarDirectiveValue>, vnode: VNode): ScrollbarMode {
    if (binding.value) return binding.value;
    if (binding.modifiers.always) return 'always';
    if (binding.modifiers.hover) return 'hover';
    if (binding.modifiers.native) return 'native';
    return directiveContext(binding, vnode)?.config.scrollbar ?? 'hover';
}

function arrowsOf(binding: DirectiveBinding<ScrollbarDirectiveValue>, vnode: VNode): boolean {
    return !!binding.modifiers.arrows || !!directiveContext(binding, vnode)?.config.scrollbarArrows;
}

// The ScrollPanel's classes, with the application's `pt.scrollpanel` over
// them, as the components' own bars wear.
function partOf(context: VitralContext | undefined) {
    return (name: ScrollbarPart, state: ScrollbarPartState) => {
        const config = context?.config;
        const own = config?.unstyled ? '' : classOf(scrollpanelStyle, name, state);
        const value: PassThroughValue | undefined = config?.pt.scrollpanel?.[name];
        const resolved = typeof value === 'function' ? value({ props: {}, state, part: name }) : value;
        const extra: Record<string, unknown> = typeof resolved === 'string' ? { class: resolved } : (resolved ?? {});
        return { ...extra, class: [own, extra.class].filter(Boolean).join(' ') || undefined };
    };
}

function attach(el: HTMLElement, binding: DirectiveBinding<ScrollbarDirectiveValue>, vnode: VNode) {
    const mode = modeOf(binding, vnode);
    if (mode === 'native') return;
    const context = directiveContext(binding, vnode);
    if (!context?.config.unstyled) {
        const options = { nonce: context?.config.csp.nonce, cssLayer: context?.config.cssLayer, registry: context?.styles };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(scrollpanelStyle.name, scrollpanelStyle.css, options);
    }
    const arrows = arrowsOf(binding, vnode);
    handles.set(el, { bars: scrollbars(el, { visibility: mode, part: partOf(context), arrows }), mode, arrows });
}

function detach(el: HTMLElement) {
    handles.get(el)?.bars.destroy();
    handles.delete(el);
}

/**
 * The theme's drawn bars on any box of your own that scrolls, the same ones
 * the ScrollPanel and every component that scrolls inside wear, without
 * wrapping it: `<div v-scrollbar style="overflow: auto; height: 20rem">`.
 * The box keeps its native scrolling and its place in the layout; only its
 * native bars are hidden.
 *
 * The value or a modifier says when the bars show: `v-scrollbar="'always'"`
 * or `v-scrollbar.always`, `.hover`, `.native`. With neither, the
 * application's `scrollbar` option decides, which is `'hover'`. `.arrows`
 * puts arrows at the ends of the bars, as the application's
 * `scrollbarArrows` does for all. Register it
 * with `app.directive('scrollbar', Scrollbar)`.
 *
 * The drawing is `scrollbars` from `@vitral/dom`; this is only the Vue binding.
 */
export const Scrollbar: Directive<HTMLElement, ScrollbarDirectiveValue> = {
    mounted(el, binding, vnode) {
        attach(el, binding, vnode);
    },
    updated(el, binding, vnode) {
        const mode = modeOf(binding, vnode);
        const arrows = arrowsOf(binding, vnode);
        const handle = handles.get(el);
        if (handle?.mode === mode && handle.arrows === arrows) return;
        if (handle && mode !== 'native') {
            handle.bars.update({ visibility: mode, arrows });
            handle.mode = mode;
            handle.arrows = arrows;
            return;
        }
        detach(el);
        attach(el, binding, vnode);
    },
    beforeUnmount(el) {
        detach(el);
    }
};
