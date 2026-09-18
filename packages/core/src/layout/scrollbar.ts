/**
 * A drawn scrollbar's thumb: how long it is and where it sits, from the sizes
 * a scroll container reports. All in pixels along one axis.
 */
export interface ScrollMetrics {
    /** The container's visible size (`clientHeight`). */
    viewport: number;
    /** The content's full size (`scrollHeight`). */
    content: number;
    /** How far it is scrolled (`scrollTop`). */
    offset: number;
    /** The track's length; the viewport's by default. */
    track?: number;
    /** The shortest the thumb may get, so it stays grabbable. */
    minThumb?: number;
}

export interface ScrollThumb {
    /** False when everything fits and no bar is needed. */
    visible: boolean;
    size: number;
    position: number;
}

export function scrollThumb({ viewport, content, offset, track = viewport, minThumb = 20 }: ScrollMetrics): ScrollThumb {
    if (!(content > viewport) || viewport <= 0) return { visible: false, size: 0, position: 0 };
    const size = Math.min(track, Math.max(minThumb, (viewport / content) * track));
    const scrollable = content - viewport;
    const ratio = Math.max(0, Math.min(1, offset / scrollable));
    return { visible: true, size, position: ratio * (track - size) };
}

/** The scroll offset for a thumb dragged to `position`. */
export function scrollOffsetAt(position: number, thumb: number, metrics: Pick<ScrollMetrics, 'viewport' | 'content' | 'track'>): number {
    const track = metrics.track ?? metrics.viewport;
    const room = track - thumb;
    if (room <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, position / room));
    return ratio * Math.max(0, metrics.content - metrics.viewport);
}
