import type { TokenTree } from '../../engine/types';

/**
 * The edges a theme draws when `borders: 'strong'` is asked for.
 *
 * WCAG 1.4.11 wants the boundary that tells a person where a control is to
 * reach 3:1 against what is next to it. The quiet default does not: it suggests
 * the shape of a field rather than outlining it, which is the look most of these
 * presets are after. This set trades that look for the criterion.
 *
 * Two kinds of edge, deliberately not the same weight. A field's own edge goes
 * just past 3:1 — the palette steps either side of the bar are 2.56 and 4.83,
 * so the lighter one is darkened past it rather than jumping a shade heavier
 * than asked for. A surface's edge — a card, a popover — stops near 2:1: 1.4.11
 * does not ask a container for 3:1, and a card shouting as loudly as the fields
 * inside it flattens the hierarchy into one line weight. Container quieter,
 * control louder; `contrast.spec.ts` holds both to it.
 */
export const strongBorders: TokenTree = {
    colorScheme: {
        light: {
            // Hover follows the resting edge up a step, or the two cross over.
            formField: { borderColor: 'color-mix(in srgb, {text.color} 36%, {surface.300})', hoverBorderColor: '{surface.500}' },
            content: { borderColor: 'color-mix(in srgb, {text.color} 22%, {surface.200})' },
            overlay: {
                select: { borderColor: 'color-mix(in srgb, {text.color} 22%, {surface.200})' },
                popover: { borderColor: 'color-mix(in srgb, {text.color} 22%, {surface.200})' },
                modal: { borderColor: 'color-mix(in srgb, {text.color} 22%, {surface.200})' }
            }
        },
        dark: {
            formField: { borderColor: 'color-mix(in srgb, {text.color} 8%, {surface.600})' },
            content: { borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
            overlay: {
                select: { borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
                popover: { borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
                modal: { borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' }
            }
        }
    }
};
