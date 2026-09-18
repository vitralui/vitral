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
    | { kind: 'window'; source: string; window: [number, number] | null; autoScaleY?: boolean };

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

/** The channel a brush and its target talk on. */
export const brushChannel = (id: string) => `brush:${id}`;
export const groupChannel = (name: string) => `group:${name}`;
