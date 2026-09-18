import { isClient } from '../utils/dom';

/**
 * An overlay scope is an element marked `data-vt-overlay-scope` whose direct
 * child marked `data-vt-overlay-host` receives the popups opened inside it, so
 * they inherit the scope's custom properties (another theme, another
 * scheme) and, when the host is a containing block, stay within it.
 */
export const OVERLAY_SCOPE_ATTR = 'data-vt-overlay-scope';
export const OVERLAY_HOST_ATTR = 'data-vt-overlay-host';

/** Where a popup opened from `el` belongs: its scope's host, or `<body>`. */
export function overlayContainerOf(el: Element | null | undefined): HTMLElement | null {
    if (!isClient) return null;
    const scope = el?.closest(`[${OVERLAY_SCOPE_ATTR}]`);
    const host = scope && Array.from(scope.children).find((child) => child.hasAttribute(OVERLAY_HOST_ATTR));
    return (host as HTMLElement | undefined) ?? document.body;
}
