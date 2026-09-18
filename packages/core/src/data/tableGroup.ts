import type { ColumnLayout } from './columns';

/**
 * Tables that work together: one above another, or side by side, read as one
 * thing. A small bus keyed by group name, with no framework in it — whichever
 * table the reader scrolls or rearranges publishes what changed, and the
 * others follow.
 *
 * What travels is the scroll position and the layout, both of which are about
 * the columns rather than the rows: two tables of the same columns stay lined
 * up, and one that has only some of them takes what applies to it.
 */

export type TableGroupMessage =
    /** Someone scrolled sideways; the number is the distance from the leading edge. */
    | { kind: 'scroll'; source: string; left: number }
    /** Someone rearranged the columns. */
    | { kind: 'layout'; source: string; layout: ColumnLayout };

type Listener = (message: TableGroupMessage) => void;

const channels = new Map<string, Set<Listener>>();

export const tableBus = {
    subscribe(channel: string, listener: Listener): () => void {
        let set = channels.get(channel);
        if (!set) channels.set(channel, (set = new Set()));
        set.add(listener);
        return () => {
            set!.delete(listener);
            if (!set!.size) channels.delete(channel);
        };
    },
    publish(channel: string, message: TableGroupMessage): void {
        channels.get(channel)?.forEach((listener) => listener(message));
    },
    /** The last layout published on a channel, for a table that joins late. */
    lastLayout: new Map<string, ColumnLayout>()
};

/**
 * The part of a shared layout that applies to a table: the columns it has, and
 * the widths and pins for those. A table of three columns beside one of six
 * keeps its own three in step without inheriting the other's.
 */
export function layoutFor(keys: readonly string[], shared: ColumnLayout | null | undefined, own: ColumnLayout | null | undefined): ColumnLayout {
    if (!shared) return { ...own };
    const has = (key: string) => keys.includes(key);
    const pick = <T>(record: Record<string, T> | undefined) => Object.fromEntries(Object.entries(record ?? {}).filter(([key]) => has(key)));
    const order = (shared.order ?? []).filter(has);
    return {
        order: order.length ? order : own?.order,
        widths: { ...own?.widths, ...pick(shared.widths) },
        hidden: (shared.hidden ?? []).filter(has),
        pinned: { ...own?.pinned, ...pick(shared.pinned) }
    };
}
