import { autoUpdate, computePosition, flip, offset as offsetBy, shift, size, type Middleware, type Placement } from '@floating-ui/dom';

export type { Placement };

export interface AnchorOptions {
    placement?: Placement;
    /** Gap between the anchor and the popup, in pixels. */
    offset?: number;
    /**
     * Shift along the anchor's edge, in pixels. Negative pulls a submenu up so
     * its first item lines up with the item that opened it.
     */
    alignmentOffset?: number;
    /** Move to the opposite side when there is no room. Defaults to true. */
    flip?: boolean;
    /** Make the popup at least as wide as the anchor, which is what a select's panel wants. */
    matchWidth?: boolean;
    strategy?: 'absolute' | 'fixed';
}

/**
 * Keeps `floating` attached to `reference` while either moves, resizes or
 * scrolls, and writes the side it ended up on to `data-placement` so CSS can
 * point an arrow or pick an animation. Returns the cleanup function.
 */
export function anchorTo(reference: Element, floating: HTMLElement, options: AnchorOptions = {}): () => void {
    const { placement = 'bottom-start', offset = 4, alignmentOffset = 0, flip: allowFlip = true, matchWidth = false, strategy = 'fixed' } = options;
    floating.style.position = strategy;
    floating.style.left = '0px';
    floating.style.top = '0px';

    const middleware: Middleware[] = [offsetBy({ mainAxis: offset, alignmentAxis: alignmentOffset })];
    if (allowFlip) middleware.push(flip({ padding: 8 }));
    middleware.push(shift({ padding: 8 }));
    if (matchWidth) {
        middleware.push(
            size({
                apply({ rects }) {
                    floating.style.minWidth = `${rects.reference.width}px`;
                }
            })
        );
    }

    const update = () =>
        computePosition(reference, floating, { placement, strategy, middleware }).then(({ x, y, placement: final }) => {
            floating.style.left = `${x}px`;
            floating.style.top = `${y}px`;
            floating.dataset.placement = final;
        });

    return autoUpdate(reference, floating, update);
}
