import { edgeScrollSpeed } from '@vitral/core';

export interface AutoScrollOptions {
    containers: () => (Element | null | undefined)[];
    /** Called after each step, so a drag can look again at what is under the pointer. */
    onScroll?: () => void;
    /** How near an edge the pointer has to be, in pixels. Defaults to 48. */
    edge?: number;
    /** Pixels per frame at the very edge. Defaults to 18. */
    speed?: number;
}

/**
 * Scrolls the containers under a drag while the pointer is near one of their
 * edges, and the window too, calling `onScroll` after each step so the drag
 * can look again at what is under the pointer.
 */
export function autoScroll(options: AutoScrollOptions) {
    let frame = 0;
    let point: { x: number; y: number } | null = null;

    function tick() {
        frame = 0;
        if (!point) return;
        let moved = false;
        const { edge = 48, speed = 18 } = options;
        for (const el of options.containers()) {
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const inside = point.x >= rect.left - edge && point.x <= rect.right + edge && point.y >= rect.top - edge && point.y <= rect.bottom + edge;
            if (!inside) continue;
            const canX = el.scrollWidth > el.clientWidth;
            const canY = el.scrollHeight > el.clientHeight;
            const dx = canX && point.y >= rect.top && point.y <= rect.bottom ? edgeScrollSpeed(point.x, rect.left, rect.right, edge, speed) : 0;
            const dy = canY && point.x >= rect.left && point.x <= rect.right ? edgeScrollSpeed(point.y, rect.top, rect.bottom, edge, speed) : 0;
            if (dx || dy) {
                const before = el.scrollLeft + el.scrollTop;
                el.scrollBy?.(dx, dy);
                if (el.scrollLeft + el.scrollTop !== before) moved = true;
            }
        }
        const dy = edgeScrollSpeed(point.y, 0, window.innerHeight, edge, speed);
        if (dy) {
            const before = window.scrollY;
            window.scrollBy?.(0, dy);
            if (window.scrollY !== before) moved = true;
        }
        if (moved) options.onScroll?.();
        frame = requestAnimationFrame(tick);
    }

    function update(x: number, y: number) {
        point = { x, y };
        if (!frame && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick);
    }

    function stop() {
        point = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
    }

    return { update, stop };
}
