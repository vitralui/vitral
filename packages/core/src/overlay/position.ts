import { arrow as arrowTo, autoUpdate, computePosition, flip, limitShift, offset as offsetBy, shift, size, type Middleware, type Placement } from '@floating-ui/dom';

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
    /**
     * An element inside the popup that points at the anchor. It is placed
     * along the popup's edge facing the anchor, where the anchor's middle is,
     * however far the popup had to shift to stay on screen.
     */
    arrow?: HTMLElement | null;
    /** How near the popup's corners the arrow may go, in pixels. Defaults to 8. */
    arrowPadding?: number;
    /**
     * Draw a pointer from the popup to its anchor: an element of class
     * `vt-overlay-arrow` is put in the popup for as long as it is attached,
     * wearing the popup's own fill and border, on whichever side it ends up.
     * The gap grows by half the arrow, so its tip just reaches the anchor.
     */
    withArrow?: boolean;
}



/**
 * Keeps `floating` attached to `reference` while either moves, resizes or
 * scrolls, and writes the side it ended up on to `data-placement` so CSS can
 * point an arrow or pick an animation. Returns the cleanup function.
 */
export function anchorTo(reference: Element, floating: HTMLElement, options: AnchorOptions = {}): () => void {
    const { placement = 'bottom-start', alignmentOffset = 0, flip: allowFlip = true, matchWidth = false, strategy = 'fixed', arrowPadding = 8, withArrow = false } = options;
    let arrow = options.arrow;
    let made: HTMLElement | null = null;
    if (withArrow && !arrow) {
        made = floating.ownerDocument.createElement('span');
        made.className = 'vt-overlay-arrow';
        made.setAttribute('aria-hidden', 'true');
        floating.appendChild(made);
        // A panel clips what leaves its box, and half the arrow does.
        floating.classList.add('vt-overlay-with-arrow');
        arrow = made;
    }
    // How far the arrow stands out of the popup: half its square's diagonal,
    // read from the size the theme gave it.
    const side = made ? parseFloat(getComputedStyle(made).width) || 10 : 0;
    const offset = (options.offset ?? 4) + (withArrow ? Math.round(side * Math.SQRT1_2) : 0);
    floating.style.position = strategy;
    floating.style.left = '0px';
    floating.style.top = '0px';

    const middleware: Middleware[] = [offsetBy({ mainAxis: offset, alignmentAxis: alignmentOffset })];
    if (allowFlip) middleware.push(flip({ padding: 8 }));
    // Both axes: a submenu opening to the right of its item slides along the
    // item's edge by default, and on a phone what it needs is to come back from
    // off the right of the screen. The limiter stops it sliding so far that it
    // leaves the item it belongs to.
    middleware.push(shift({ padding: 8, crossAxis: true, limiter: limitShift() }));
    if (matchWidth) {
        middleware.push(
            size({
                apply({ rects }) {
                    // As wide as what it hangs from, but never wider than the
                    // window: a bar that scrolls sideways on a phone would
                    // otherwise hand its panel a width the screen has not got,
                    // and a minimum outranks a maximum.
                    floating.style.minWidth = `min(${rects.reference.width}px, calc(100vw - 1rem))`;
                }
            })
        );
    }

    if (arrow) middleware.push(arrowTo({ element: arrow, padding: arrowPadding }));

    const update = () =>
        computePosition(reference, floating, { placement, strategy, middleware }).then(({ x, y, placement: final, middlewareData }) => {
            floating.style.left = `${x}px`;
            floating.style.top = `${y}px`;
            floating.dataset.placement = final;
            if (arrow && middlewareData.arrow) {
                const { x: ax, y: ay } = middlewareData.arrow;
                arrow.style.left = ax === undefined ? '' : `${ax}px`;
                arrow.style.top = ay === undefined ? '' : `${ay}px`;
            }
        });

    const stop = autoUpdate(reference, floating, update);
    return () => {
        stop();
        if (made) {
            made.remove();
            floating.classList.remove('vt-overlay-with-arrow');
        }
    };
}
