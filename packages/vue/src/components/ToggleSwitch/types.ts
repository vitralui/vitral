import type { BaseProps } from '../../base/types';

export interface ToggleSwitchProps extends BaseProps {
    /** The header above the switch (the header, not the on/off text); it is the switch's `<label>` and so its accessible name. */
    label?: string;
    /** Shown beside the switch while it is on. */
    onLabel?: string;
    /** Shown beside the switch while it is off. */
    offLabel?: string;
    /** Show the locale's On/Off beside the switch when no `onLabel`/`offLabel` is given. */
    showStateLabel?: boolean;
    invalid?: boolean;
    disabled?: boolean;
}

export interface ToggleSwitchChangeEvent {
    originalEvent: Event;
    checked: boolean;
}

export type ToggleSwitchEmits = {
    change: [event: ToggleSwitchChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface ToggleSwitchSlots {
    /** Replaces the header text. */
    default?: () => unknown;
    /** Replaces the on/off content beside the switch. */
    content?: (props: { checked: boolean }) => unknown;
}
