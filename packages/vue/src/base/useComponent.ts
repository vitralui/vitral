import { baseStyle, classOf, type ComponentStyle } from '@vitral/styles';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import { computed, mergeProps, useAttrs, watchEffect } from 'vue';
import { useVitral } from '../config/config';
import { loadStyle } from '../composables/useStyle';
import type { BaseProps, PassThroughAttrs, PassThroughContext, PassThroughValue } from './types';

function resolvePassThrough(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

/**
 * The plumbing every component shares: loading its stylesheet, the class of
 * each part, global and local pass-through, and per-instance design tokens.
 *
 * Templates spread `part('name', state)` onto each element. That one call is
 * what makes a component themeable, restylable part by part, and usable
 * unstyled, so a component that uses it everywhere gets all three for free.
 */
export function useComponent(style: ComponentStyle, props: BaseProps) {
    const context = useVitral();
    const { config } = context;
    const unstyled = computed(() => props.unstyled ?? config.unstyled);

    watchEffect(() => {
        if (unstyled.value) return;
        const options = { nonce: config.csp.nonce, cssLayer: config.cssLayer, registry: context.styles };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(style.name, style.css, options);
    });

    const tokens = computed(() => (props.dt ? flattenTokens(props.dt as TokenTree, [], context.theme?.options.prefix) : undefined));

    function cx(name: string, state?: unknown): string | undefined {
        if (unstyled.value) return undefined;
        return classOf(style, name, state) || undefined;
    }

    function ptm(name: string, state?: unknown): PassThroughAttrs {
        const ctx: PassThroughContext = { props: props as Record<string, unknown>, state, part: name };
        const global = config.pt[style.name]?.[name];
        const local = props.pt?.[name];
        return mergeProps(resolvePassThrough(global, ctx), resolvePassThrough(local, ctx));
    }

    /** Class, tokens (on the root) and pass-through for one part, merged in that order. */
    function part(name: string, state?: unknown): PassThroughAttrs {
        const own: PassThroughAttrs = { class: cx(name, state) };
        if (name === 'root' && tokens.value) own.style = tokens.value;
        return mergeProps(own, ptm(name, state));
    }

    const locale = computed(() => config.locale);

    return { context, config, unstyled, cx, ptm, part, locale };
}

/**
 * Splits `$attrs` for a component whose root is a wrapper around a native
 * control: `class` and `style` dress the wrapper, and everything else (`id`,
 * `name`, `placeholder`, `aria-*`, listeners) belongs to the control, which is
 * where a `<label for>` and a screen reader expect to find it.
 */
export function useSplitAttrs() {
    const attrs = useAttrs();
    const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
    const controlAttrs = computed(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { class: _class, style: _style, ...rest } = attrs;
        return rest;
    });
    return { attrs, rootAttrs, controlAttrs };
}
