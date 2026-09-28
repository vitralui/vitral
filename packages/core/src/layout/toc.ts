/** A heading an outline lists: where it goes, what it says and how deep it sits. */
export interface OutlineItem {
    id: string;
    label: string;
    /** 1 for the top level; nested levels are indented under it. */
    level: number;
}

/**
 * The section being read: the last heading whose top has passed `offset`
 * pixels from the top of the view. Before the first one, the first; at the
 * very bottom of the page, the last, which may be too short ever to reach the
 * top. `tops` are the headings' tops relative to the view, in outline order.
 */
export function activeOutlineIndex(tops: readonly number[], offset = 0, atBottom = false): number {
    if (!tops.length) return -1;
    if (atBottom) return tops.length - 1;
    let active = 0;
    tops.forEach((top, i) => {
        if (top - offset <= 1) active = i;
    });
    return active;
}

/** The outline's levels made relative: the shallowest heading present is level 1. */
export function normalizeOutline(items: readonly OutlineItem[]): OutlineItem[] {
    const min = Math.min(...items.map((i) => i.level));
    return items.map((item) => ({ ...item, level: item.level - min + 1 }));
}
