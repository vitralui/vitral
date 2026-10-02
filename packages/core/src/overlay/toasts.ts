/**
 * Which toasts a stack shows and in what order. Pinned ones lead and are
 * always shown; the rest fill whatever room `max` leaves, oldest first, and
 * the newer ones wait their turn. `newestFirst` puts the latest at the head
 * of each part, which a stack drawn as a pile needs: its front card is the
 * newest.
 */
export function arrangeToasts<T extends { pinned?: boolean }>(items: readonly T[], options: { max?: number; newestFirst?: boolean } = {}): { shown: T[]; waiting: T[] } {
    const pinned = items.filter((item) => item.pinned);
    const rest = items.filter((item) => !item.pinned);
    const room = options.max && options.max > 0 ? Math.max(0, options.max - pinned.length) : rest.length;
    const shownRest = rest.slice(0, room);
    const waiting = rest.slice(room);
    const order = (list: T[]) => (options.newestFirst ? [...list].reverse() : list);
    return { shown: [...order(pinned), ...order(shownRest)], waiting };
}

/**
 * The toast a new one should close to make room, when a stack replaces
 * rather than queues: the oldest that is not pinned, once the unpinned ones
 * fill what `max` leaves. Null when there is room, or nothing may go.
 */
export function toastToReplace<T extends { pinned?: boolean }>(items: readonly T[], max: number | undefined): T | null {
    if (!max || max <= 0) return null;
    const pinned = items.filter((item) => item.pinned).length;
    const rest = items.filter((item) => !item.pinned);
    return rest.length >= Math.max(1, max - pinned) ? (rest[0] ?? null) : null;
}
