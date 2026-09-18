import type { BaseProps } from '../../base/types';

export interface TimelineProps extends BaseProps {
    /** The events, in order. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any[];
    /** Which side the content is on: `left`, `right` or `alternate` vertically; `top`, `bottom` or `alternate` horizontally. */
    align?: 'left' | 'right' | 'alternate' | 'top' | 'bottom';
    /** Events down the page (the default) or across it. */
    layout?: 'vertical' | 'horizontal';
    /** A field that identifies an event. */
    dataKey?: string;
}

export interface TimelineSlots {
    /** An event's content. */
    content?: (props: { item: unknown; index: number }) => unknown;
    /** What sits across the axis from the content: a date, say. */
    opposite?: (props: { item: unknown; index: number }) => unknown;
    /** Replaces the marker. */
    marker?: (props: { item: unknown; index: number }) => unknown;
    /** Replaces the line to the next event. */
    connector?: (props: { item: unknown; index: number }) => unknown;
}
