import { createTooltip, type Placement, type TooltipHandle, type TooltipOptions } from '@vitral/core';
import { classOf, tooltipStyle } from '@vitral/styles';
import type { ComponentPublicInstance, Directive, DirectiveBinding } from 'vue';
import type { PassThroughValue } from '../base/types';
import { loadStyle } from '../composables/useStyle';
import type { VitralContext } from '../config/config';

export interface TooltipDirectiveOptions {
    value?: string;
    /** Defaults to `'top'`; the `.top/.bottom/.left/.right` modifiers set it too. */
    placement?: Placement;
    /** Milliseconds before it shows. */
    showDelay?: number;
    /** Milliseconds before it hides once the pointer leaves. */
    hideDelay?: number;
    disabled?: boolean;
}

export type TooltipDirectiveValue = string | TooltipDirectiveOptions | null | undefined;

const handles = new WeakMap<HTMLElement, TooltipHandle>();
const sides = ['top', 'bottom', 'left', 'right'] as const;

function contextOf(binding: DirectiveBinding): VitralContext | undefined {
    return (binding.instance as (ComponentPublicInstance & { $vitral?: VitralContext }) | null)?.$vitral;
}

// The class from the style's map, merged with global pass-through
// (`pt: { tooltip: { root: '…', text: {…} } }`), as a component's part() does.
function partAttrs(part: 'root' | 'text', context: VitralContext | undefined): Record<string, string | undefined> {
    const config = context?.config;
    const own = config?.unstyled ? '' : classOf(tooltipStyle, part);
    const value: PassThroughValue | undefined = config?.pt.tooltip?.[part];
    const resolved = typeof value === 'function' ? value({ props: {}, state: undefined, part }) : value;
    const extra: Record<string, unknown> = typeof resolved === 'string' ? { class: resolved } : (resolved ?? {});
    const attrs: Record<string, string | undefined> = {};
    for (const [key, v] of Object.entries(extra)) if (typeof v === 'string' || typeof v === 'number') attrs[key] = String(v);
    attrs.class = [own, attrs.class].filter(Boolean).join(' ') || undefined;
    return attrs;
}

function optionsOf(binding: DirectiveBinding<TooltipDirectiveValue>): TooltipOptions {
    const raw = binding.value;
    const options: TooltipDirectiveOptions = raw !== null && typeof raw === 'object' ? raw : { value: raw ?? undefined };
    const modifier = sides.find((side) => binding.modifiers[side]);
    const context = contextOf(binding);
    return {
        text: options.value,
        placement: options.placement ?? modifier ?? 'top',
        showDelay: options.showDelay ?? 0,
        hideDelay: options.hideDelay ?? 0,
        disabled: options.disabled ?? false,
        zIndex: context?.config.zIndex.tooltip ?? 1100,
        rootAttrs: partAttrs('root', context),
        textAttrs: partAttrs('text', context)
    };
}

/**
 * `v-tooltip="'Save'"`, `v-tooltip.bottom="…"` or
 * `v-tooltip="{ value, placement, showDelay, hideDelay, disabled }"`.
 * Register it with `app.directive('tooltip', Tooltip)`.
 *
 * The behaviour (hover and keyboard focus, Escape, `role="tooltip"` and the
 * host's `aria-describedby`) is `createTooltip` from `@vitral/core`. This is
 * only the Vue binding, so another framework's adapter is a few lines too.
 */
export const Tooltip: Directive<HTMLElement, TooltipDirectiveValue> = {
    mounted(el, binding) {
        const context = contextOf(binding);
        if (!context?.config.unstyled) loadStyle(tooltipStyle.name, tooltipStyle.css, { nonce: context?.config.csp.nonce, cssLayer: context?.config.cssLayer, registry: context?.styles });
        handles.set(el, createTooltip(el, optionsOf(binding)));
    },
    updated(el, binding) {
        handles.get(el)?.update(optionsOf(binding));
    },
    beforeUnmount(el) {
        handles.get(el)?.destroy();
        handles.delete(el);
    }
};
