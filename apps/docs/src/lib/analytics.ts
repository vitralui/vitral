/**
 * What readers do on a page, sent to Google Analytics next to the page views.
 * A page view alone cannot tell a reader who copied the install command and
 * left satisfied from one who left at once: both are one page and out. These
 * events can, and the ones marked as key events in Analytics (`copy_code`,
 * `outbound_click`) count a session as engaged however short it was.
 *
 * The tag is only loaded on the published site (see `index.html`), so
 * everywhere else these calls go nowhere.
 */
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

export type AnalyticsEvent =
    /** A code block or the install command copied. `label` is what the block is called. */
    | 'copy_code'
    /** An example's markup unfolded. */
    | 'view_code'
    /** A link off the site: GitHub, npm and the like. */
    | 'outbound_click'
    /** A result picked from the search. */
    | 'search'
    /** The preset, the scheme or the direction changed. */
    | 'change_theme'
    /** Another package manager picked for the install commands. */
    | 'change_install_manager';

export function track(event: AnalyticsEvent, params: Record<string, string | number> = {}): void {
    if (typeof window === 'undefined') return;
    window.gtag?.('event', event, params);
}

/**
 * Every press on a link that leaves the site, wherever the link is: the bar,
 * the footer, a guide's prose. One listener sees them all, so a link added
 * later is counted without anyone remembering to.
 */
export function trackOutboundLinks(): void {
    addEventListener(
        'click',
        (event) => {
            const link = (event.target as Element | null)?.closest?.('a');
            if (!link?.href) return;
            const url = new URL(link.href, location.href);
            if (url.origin === location.origin || !/^https?:$/.test(url.protocol)) return;
            track('outbound_click', { link_url: url.href, link_domain: url.hostname });
        },
        // Before the router, which may stop the press from going further.
        { capture: true }
    );
}
