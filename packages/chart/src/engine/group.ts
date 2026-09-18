/**
 * Charts that work together: ApexCharts' `chart.group`, and a brush driving
 * its target. A small bus, keyed by group name or chart id, with no framework
 * in it: whichever chart the pointer is on publishes the column it points at,
 * and a zoom publishes the window; the others follow. Sharing is by column
 * index for the crosshair (which survives charts of different widths) and by
 * domain value for the window.
 */

export type ChartGroupMessage =
    | { kind: 'hover'; source: string; column: number }
    | { kind: 'leave'; source: string }
    | { kind: 'window'; source: string; window: [number, number] | null; autoScaleY?: boolean }
    /** The group's widest axis changed: whoever is narrower has to make room. */
    | { kind: 'layout'; source: string };

type Listener = (message: ChartGroupMessage) => void;

const channels = new Map<string, Set<Listener>>();

export const chartBus = {
    subscribe(channel: string, listener: Listener): () => void {
        let set = channels.get(channel);
        if (!set) channels.set(channel, (set = new Set()));
        set.add(listener);
        return () => {
            set!.delete(listener);
            if (!set!.size) channels.delete(channel);
        };
    },
    publish(channel: string, message: ChartGroupMessage): void {
        channels.get(channel)?.forEach((listener) => listener(message));
    },
    /** The last window published on a channel, for a chart that joins late. */
    lastWindow: new Map<string, [number, number] | null>()
};

/**
 * How much room each chart in a group needs for its own axes. Charts in a group
 * are read down the column — a price above its volume — and that only works if
 * their plots start and end at the same x. They do not, left alone: `$210.00`
 * is wider than `10K`, so the price's plot begins further in and every bar sits
 * a few pixels off the candle it belongs to.
 *
 * Each chart reports what it needs and is told what the group needs, which is
 * the widest of them. It reports its own measurement rather than the answer it
 * was given, so the maximum settles after one round instead of ratcheting up.
 */
const insets = new Map<string, Map<string, { left: number; right: number }>>();

export interface ChartInset {
    left: number;
    right: number;
}

const widest = (group: Map<string, ChartInset>): ChartInset => ({
    left: Math.max(0, ...Array.from(group.values(), (i) => i.left)),
    right: Math.max(0, ...Array.from(group.values(), (i) => i.right))
});

/** Reports what this chart needs and answers with what the group needs. */
export function alignInset(group: string, id: string, needs: ChartInset): ChartInset {
    let members = insets.get(group);
    if (!members) insets.set(group, (members = new Map()));
    const before = members.size ? widest(members) : { left: 0, right: 0 };
    members.set(id, needs);
    const after = widest(members);
    // Only a change moves anybody: publishing on every render would be a loop.
    if (after.left !== before.left || after.right !== before.right) {
        // After this render, not during it: the others are mid-layout too.
        queueMicrotask(() => chartBus.publish(groupChannel(group), { kind: 'layout', source: id }));
    }
    return after;
}

/** A chart that has gone stops holding the group open at its width. */
export function releaseInset(group: string, id: string): void {
    const members = insets.get(group);
    if (!members?.delete(id)) return;
    if (!members.size) insets.delete(group);
    else queueMicrotask(() => chartBus.publish(groupChannel(group), { kind: 'layout', source: id }));
}

/** The channel a brush and its target talk on. */
export const brushChannel = (id: string) => `brush:${id}`;
export const groupChannel = (name: string) => `group:${name}`;
