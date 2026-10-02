import type { MaskProp } from '@vitral/core';
import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface TimePickerProps extends BaseProps {
    /** Minutes between the times the list offers. Defaults to 30. */
    step?: number;
    /** The earliest time, as minutes past midnight or `'09:00'`. */
    minTime?: number | string | null;
    /** The latest, likewise. */
    maxTime?: number | string | null;
    /** Force twelve- or twenty-four-hour; defaults to what the locale writes. */
    hour12?: boolean;
    /** Show seconds in what is written; the list is still built from `step`. */
    seconds?: boolean;
    /**
     * Whether the text box types into the shape the time is written in. On by
     * default on a twenty-four-hour clock (`99:99`, or `99:99:99` with
     * seconds); a twelve-hour time, whose hour has no fixed width, is left
     * free. `false` leaves the box free; a mask of your own, as InputMask
     * takes, replaces the derived one.
     */
    mask?: boolean | MaskProp;
    placeholder?: string;
    /** Show the list in place, without a text box or popup. */
    inline?: boolean;
    /** A footer button that empties the value. */
    showClearButton?: boolean;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type TimePickerEmits = {
    /** A time was chosen from the list, or typed and committed. */
    timeSelect: [minutes: number];
    clear: [];
    show: [];
    hide: [];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface TimePickerSlots {
    /** The icon in the button that opens the list. */
    dropdownicon?: () => unknown;
    /** One time in the list. */
    option?: (props: { minutes: number; label: string; selected: boolean }) => unknown;
    /** Under the list: a note, a pair of buttons. */
    footer?: (props: { minutes: number | null; clear: () => void }) => unknown;
}
