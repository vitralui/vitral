import { createTooltip, loadStyle, type Placement, type TooltipHandle } from '@vitral/core';
import type { PassThrough, PassThroughContext, PassThroughValue } from '@vitral/dom';
import { classOf, tooltipStyle } from '@vitral/styles';

/**
 * The tooltip an addon hangs on its own buttons. The behaviour is
 * `createTooltip` from `@vitral/core` — hover and keyboard focus, Escape,
 * `role="tooltip"` and the host's `aria-describedby` — exactly what the Vue
 * directive binds to; this is the piece that keeps one per element, dresses it
 * in the Vitral styles and takes them all back when the addon goes.
 *
 * Without it an addon's only choice was the browser's own `title`, which waits
 * a second, wears the operating system's colours and never appears for a
 * keyboard at all.
 */

export interface TooltipsOptions {
    placement?: Placement;
    /** Milliseconds before it shows. Long enough not to fire on a pointer passing through. */
    showDelay?: number;
    unstyled?: boolean;
    nonce?: string;
    cssLayer?: string | false;
    zIndex?: number;
    pt?: PassThrough;
}

export interface Tooltips {
    /** Gives an element its tooltip, or changes the words; `undefined` takes it away. */
    attach(element: Element | null, text: string | undefined): void;
    destroy(): void;
}

function partAttrs(part: 'root' | 'text', options: TooltipsOptions): Record<string, string | undefined> {
    const own = options.unstyled ? '' : classOf(tooltipStyle, part);
    const value: PassThroughValue | undefined = options.pt?.[part];
    const resolved = typeof value === 'function' ? value({ props: {}, state: undefined, part } as PassThroughContext) : value;
    const extra: Record<string, unknown> = typeof resolved === 'string' ? { class: resolved } : ((resolved as Record<string, unknown>) ?? {});
    const attrs: Record<string, string | undefined> = {};
    for (const [key, v] of Object.entries(extra)) if (typeof v === 'string' || typeof v === 'number') attrs[key] = String(v);
    attrs.class = [own, attrs.class].filter(Boolean).join(' ') || undefined;
    return attrs;
}

export function createTooltips(settings: () => TooltipsOptions): Tooltips {
    const tips = new Map<Element, TooltipHandle>();
    let loaded = false;

    return {
        attach(element, text) {
            if (!element) return;
            const options = settings();
            const existing = tips.get(element);
            if (text === undefined || text === '') {
                existing?.destroy();
                tips.delete(element);
                return;
            }
            if (!loaded && !options.unstyled) {
                loaded = true;
                loadStyle(tooltipStyle.name, tooltipStyle.css, { nonce: options.nonce, cssLayer: options.cssLayer });
            }
            const config = {
                text,
                placement: options.placement ?? 'bottom',
                showDelay: options.showDelay ?? 400,
                zIndex: options.zIndex,
                rootAttrs: partAttrs('root', options),
                textAttrs: partAttrs('text', options)
            };
            if (existing) existing.update(config);
            else tips.set(element, createTooltip(element as HTMLElement, config));
        },
        destroy() {
            for (const tip of tips.values()) tip.destroy();
            tips.clear();
        }
    };
}
