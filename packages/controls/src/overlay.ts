import { anchorTo, isClient, overlayContainerOf, pushLayer, ZIndex, type Placement } from '@vitral/core';
import { createPortal, type VElement } from '@vitral/dom';

/**
 * A panel that hangs from something: put in an overlay host, kept against its
 * anchor while anything moves, and closed the way every panel closes — Escape,
 * which puts the keyboard back where it was, or a press outside it.
 *
 * Every addon needs this and each was writing it again: the portal, the
 * anchoring, the layer stack and the z-index are four things to get right and
 * one of them was already drifting.
 */

export type OverlayTarget = HTMLElement | string | null | undefined | (() => OverlayTarget);

/** Why an overlay closed: what shut it decides whether the keyboard goes back. */
export type CloseReason = 'escape' | 'outside' | 'request';

export interface OverlayOptions {
    /** The element the panel hangs from, read every time it is drawn. */
    anchor: () => HTMLElement | null | undefined;
    /** The panel itself, drawn on open and on every `update()`. */
    render: () => VElement | null;
    placement?: Placement;
    /** Gap between the anchor and the panel, in pixels. */
    offset?: number;
    /** Make the panel at least as wide as its anchor, which is what a select wants. */
    matchWidth?: boolean;
    /** Where the panel is put; the nearest overlay scope, else the document's body. */
    target?: OverlayTarget;
    zIndex?: number;
    /** The element the panel belongs to, for deciding what is "outside". Defaults to the anchor. */
    inside?: () => (Element | null | undefined)[];
    /** Put the keyboard back on the anchor when Escape closed it. Defaults to true. */
    restoreFocus?: boolean;
    onOpen?: (panel: HTMLElement) => void;
    onClose?: (reason: CloseReason) => void;
}

export interface Overlay {
    open(): void;
    close(reason?: CloseReason): void;
    toggle(): void;
    /** Draws the panel again, while it is open. */
    update(): void;
    readonly isOpen: boolean;
    /** The panel, while it is open. */
    element(): HTMLElement | null;
    destroy(): void;
}

export function createOverlay(options: OverlayOptions): Overlay {
    const portal = createPortal();
    let open = false;
    let stop: (() => void) | null = null;
    let panel: HTMLElement | null = null;

    function host(): HTMLElement {
        // A target may be given as a function, and what it gives may be another
        // function: a host passing its own option straight through.
        let target: OverlayTarget = options.target;
        for (let depth = 0; typeof target === 'function' && depth < 4; depth++) target = target();
        let element: HTMLElement | null | undefined = typeof target === 'string' ? (target === 'body' || target === 'self' ? undefined : document.querySelector<HTMLElement>(target)) : (target as HTMLElement | null | undefined);
        if (typeof target === 'function') element = undefined;
        return element ?? overlayContainerOf(options.anchor() ?? null) ?? document.body;
    }

    function draw() {
        const anchor = options.anchor();
        const wanted = open && !!anchor && anchor.isConnected;
        const before = portal.element();
        const drawn = portal.render(wanted ? host() : null, wanted ? options.render() : null);
        panel = (drawn as HTMLElement | null) ?? null;
        if (!panel) {
            release();
            return;
        }
        if (panel === before) return;
        // A new panel: everything that was holding the old one goes with it.
        release();
        const floating = panel;
        const stops = [
            anchorTo(anchor!, floating, { placement: options.placement ?? 'bottom-start', offset: options.offset, matchWidth: options.matchWidth }),
            pushLayer({
                elements: () => options.inside?.() ?? [anchor!, floating],
                onEscape: () => close('escape'),
                onPointerDownOutside: () => close('outside')
            })
        ];
        ZIndex.set('overlay', floating, options.zIndex ?? 1000);
        stop = () => {
            stops.forEach((end) => end());
            ZIndex.clear(floating);
        };
        options.onOpen?.(floating);
    }

    function release() {
        stop?.();
        stop = null;
    }

    function close(reason: CloseReason) {
        if (!open) return;
        open = false;
        const anchor = options.anchor();
        draw();
        if (reason === 'escape' && options.restoreFocus !== false) anchor?.focus();
        options.onClose?.(reason);
    }

    return {
        open() {
            if (open || !isClient) return;
            open = true;
            draw();
        },
        close: (reason = 'request') => close(reason),
        toggle() {
            if (open) close('request');
            else this.open();
        },
        update() {
            if (open) draw();
        },
        get isOpen() {
            return open;
        },
        element: () => panel,
        destroy() {
            open = false;
            release();
            portal.render(null, null);
            panel = null;
        }
    };
}
