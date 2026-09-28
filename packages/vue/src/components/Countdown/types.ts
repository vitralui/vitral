import type { BaseProps } from '../../base/types';

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownProps extends BaseProps {
    /** The moment to count to: a Date, an ISO string or a timestamp. */
    to: Date | string | number;
    /** The units to show, largest first. Defaults to days, hours, minutes and seconds. */
    units?: CountdownUnit[];
    /** Tiles, or a line of words. Defaults to `'tiles'`. */
    variant?: 'tiles' | 'text';
    /** Leave out the leading units that are at zero: no "0 days" a day before. Defaults to true. */
    hideLeadingZeros?: boolean;
    /** Stops the clock where it is. */
    paused?: boolean;
}

export type CountdownEmits = {
    /** The moment arrived. */
    end: [];
};

export interface CountdownSlots {
    /** Replaces the whole drawing: given what is left. */
    default?: (context: { days: number; hours: number; minutes: number; seconds: number; done: boolean }) => unknown;
}
