import { scrollbars, type ScrollbarPart, type ScrollbarPartState, type Scrollbars } from '@vitral/dom';
import { baseStyle, classOf, scrollpanelStyle } from '@vitral/styles';
import { mergeProps, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useVitral } from '../config/config';
import { loadStyle } from '../composables/useStyle';
import type { PassThroughContext, PassThroughValue, ScrollbarMode } from './types';

interface ScrollbarOwner {
    scrollbar?: ScrollbarMode;
    unstyled?: boolean;
    pt?: Record<string, PassThroughValue | undefined>;
}

interface ScrollbarsUse {
    /** The mode, when the component decides it some other way than its `scrollbar` prop. */
    mode?: () => ScrollbarMode | undefined;
    /** The owner's own `pt` dresses the bars too: the ScrollPanel's `bars`, `bar` and `thumb`. */
    ownPassThrough?: boolean;
    /** Arrows, when the component decides them itself; the application's `scrollbarArrows` otherwise. */
    arrows?: () => boolean | undefined;
}

function resolve(value: PassThroughValue | undefined, context: PassThroughContext) {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

/**
 * Puts the theme's drawn bars on a box a component scrolls inside — its menu,
 * its list, its body — leaving the box and its scrolling as they are. The
 * bars wear the ScrollPanel's classes and tokens (and the application's
 * `pt.scrollpanel` for `bars`, `bar` and `thumb`), so one theme dresses every
 * bar. `props.scrollbar`, or the application's `scrollbar`, says whether they
 * wait for the pointer, stay on the screen, or give way to the native bars.
 *
 * The box may come and go (an overlay that opens): the bars follow it.
 */
export function useScrollbars(target: MaybeRefOrGetter<HTMLElement | null | undefined>, props: ScrollbarOwner, use: ScrollbarsUse = {}) {
    const context = useVitral();
    const { config } = context;
    const unstyled = () => props.unstyled ?? config.unstyled;
    const wanted = (): ScrollbarMode => use.mode?.() ?? props.scrollbar ?? config.scrollbar ?? 'hover';

    function part(name: ScrollbarPart, state: ScrollbarPartState) {
        const own = unstyled() ? {} : { class: classOf(scrollpanelStyle, name, state) || undefined };
        const ctx: PassThroughContext = { props: props as Record<string, unknown>, state, part: name };
        const global = config.pt.scrollpanel?.[name];
        const local = use.ownPassThrough ? props.pt?.[name] : undefined;
        return global || local ? mergeProps(own, resolve(global, ctx), resolve(local, ctx)) : own;
    }

    let bars: Scrollbars | null = null;
    let attached: HTMLElement | null = null;

    function detach() {
        bars?.destroy();
        bars = null;
        attached = null;
    }

    watch(
        () => [toValue(target), wanted(), unstyled(), use.arrows?.() ?? config.scrollbarArrows] as const,
        ([el, chosen, bare, arrows]) => {
            if (!el || chosen === 'native' || typeof window === 'undefined') {
                detach();
                return;
            }
            if (!bare) {
                const options = { nonce: config.csp.nonce, cssLayer: config.cssLayer, registry: context.styles };
                loadStyle(baseStyle.name, baseStyle.css, options);
                loadStyle(scrollpanelStyle.name, scrollpanelStyle.css, options);
            }
            if (el !== attached) {
                detach();
                attached = el;
                bars = scrollbars(el, { visibility: chosen, part, arrows });
            } else bars?.update({ visibility: chosen, part, arrows });
        },
        { flush: 'post', immediate: true }
    );

    onBeforeUnmount(detach);

    return {
        /** Measures again, for a change the bars could not see. */
        refresh: () => bars?.refresh()
    };
}
