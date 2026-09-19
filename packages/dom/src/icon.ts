import { s, type Child, type Props, type VElement } from './h';
import { mergeAttrs } from './attrs';

/**
 * An icon as a node, drawn the way the icon components draw it: in the SVG
 * namespace, where `viewBox` keeps its capital and the drawing is scaled to
 * the box. The definition comes from `@vitral/icons`, which this layer does
 * not depend on: the caller looks the name up.
 */

export interface IconDefLike {
    body: string;
    viewBox?: string;
    strokeWidth?: number;
}

export const ICON_VIEWBOX = '0 0 24 24';
export const ICON_STROKE_WIDTH = 1.75;

export function iconNode(def: IconDefLike | null | undefined, props?: Props): Child {
    if (!def) return null;
    return s(
        'svg',
        mergeAttrs(
            {
                class: 'vt-icon',
                viewBox: def.viewBox ?? ICON_VIEWBOX,
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': String(def.strokeWidth ?? ICON_STROKE_WIDTH),
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                focusable: 'false',
                'aria-hidden': 'true',
                innerHTML: def.body
            },
            props
        )
    ) as VElement;
}
