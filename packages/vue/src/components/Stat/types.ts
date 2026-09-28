import type { BaseProps, IconProp, Size } from '../../base/types';

export interface StatProps extends BaseProps {
    label?: string;
    /** A number is formatted for the locale with `format`; a string is shown as it is. */
    value?: number | string;
    /** `Intl.NumberFormat` options for `value`: `{ style: 'currency', currency: 'BRL' }`, `{ notation: 'compact' }`. */
    format?: Intl.NumberFormatOptions;
    prefix?: string;
    suffix?: string;
    /**
     * The change, as a ratio: `0.125` is +12.5%. A string is shown as it is,
     * and then `trend` says which way it went.
     */
    delta?: number | string;
    /** `Intl.NumberFormat` options for `delta`. Defaults to a signed percentage with one decimal. */
    deltaFormat?: Intl.NumberFormatOptions;
    /** Which way it went; worked out from the sign of a numeric `delta` otherwise. */
    trend?: 'up' | 'down' | 'neutral';
    /** A fall is the good news: costs, errors, time to load. */
    invert?: boolean;
    /** Beside the change: `'vs last month'`. */
    caption?: string;
    icon?: IconProp;
    /** Keeps the layout and shows a placeholder for the figure. */
    loading?: boolean;
    size?: Size;
}

export interface StatSlots {
    label?: () => unknown;
    /** Replaces the formatted figure. */
    value?: (context: { value: string }) => unknown;
    icon?: () => unknown;
    caption?: () => unknown;
    /** Below everything: a sparkline, a meter. */
    chart?: () => unknown;
}
