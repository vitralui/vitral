import { scrollbars, type ScrollbarPart, type ScrollbarPartState, type Scrollbars } from '@vitral/dom';
import { baseStyle, classOf, scrollpanelStyle } from '@vitral/styles';
import type { ComponentPublicInstance, Directive, DirectiveBinding } from 'vue';
import type { PassThroughValue, ScrollbarMode } from '../base/types';
import { loadStyle } from '../composables/useStyle';
import type { VitralContext } from '../config/config';

export type ScrollbarDirectiveValue = ScrollbarMode | null | undefined;

const handles = new WeakMap<HTMLElement, { bars: Scrollbars; mode: ScrollbarMode }>();

function contextOf(binding: DirectiveBinding): VitralContext | undefined {
    return (binding.instance as (ComponentPublicInstance & { $vitral?: VitralContext }) | null)?.$vitral;
}

function modeOf(binding: DirectiveBinding<ScrollbarDirectiveValue>): ScrollbarMode {
    if (binding.value) return binding.value;
    if (binding.modifiers.always) return 'always';
    if (binding.modifiers.hover) return 'hover';
    if (binding.modifiers.native) return 'native';
    return contextOf(binding)?.config.scrollbar ?? 'hover';
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

function attach(el: HTMLElement, binding: DirectiveBinding<ScrollbarDirectiveValue>) {
    const mode = modeOf(binding);
    if (mode === 'native') return;
    const context = contextOf(binding);
    if (!context?.config.unstyled) {
        const options = { nonce: context?.config.csp.nonce, cssLayer: context?.config.cssLayer, registry: context?.styles };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(scrollpanelStyle.name, scrollpanelStyle.css, options);
    }
    handles.set(el, { bars: scrollbars(el, { visibility: mode, part: partOf(context) }), mode });
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
 * application's `scrollbar` option decides, which is `'hover'`. Register it
 * with `app.directive('scrollbar', Scrollbar)`.
 *
 * The drawing is `scrollbars` from `@vitral/dom`; this is only the Vue binding.
 */
export const Scrollbar: Directive<HTMLElement, ScrollbarDirectiveValue> = {
    mounted(el, binding) {
        attach(el, binding);
    },
    updated(el, binding) {
        const mode = modeOf(binding);
        const handle = handles.get(el);
        if (handle?.mode === mode) return;
        if (handle && mode !== 'native') {
            handle.bars.update({ visibility: mode });
            handle.mode = mode;
            return;
        }
        detach(el);
        attach(el, binding);
    },
    beforeUnmount(el) {
        detach(el);
    }
};
