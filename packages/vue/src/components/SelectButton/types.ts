import type { BaseProps, IconProp, Size } from '../../base/types';

export interface SelectButtonProps extends BaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    /** Field (dotted path) holding an option's text. Without it, options are shown as they are. */
    optionLabel?: string;
    /** Field holding the value v-model receives. Without it, the whole option is the value. */
    optionValue?: string;
    optionDisabled?: string;
    /** Field holding an option's icon. */
    optionIcon?: string;
    /** Several options at once; v-model is then an array. */
    multiple?: boolean;
    /** Let the pressed option be pressed again to clear it. Defaults to true. */
    allowEmpty?: boolean;
    /** Compare object values by this field instead of structurally. */
    dataKey?: string;
    size?: Size;
    disabled?: boolean;
    invalid?: boolean;
    fluid?: boolean;
    /** Names the group; without it, name it with `aria-label` or `aria-labelledby`. */
    label?: string;
}

export interface SelectButtonChangeEvent {
    originalEvent: Event;
    value: unknown;
}

export type SelectButtonEmits = {
    change: [event: SelectButtonChangeEvent];
};

export interface SelectButtonSlots {
    option?: (props: { option: unknown; index: number; checked: boolean }) => unknown;
    icon?: (props: { option: unknown; icon?: IconProp }) => unknown;
}
