import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface CascadeSelectProps extends BaseProps {
    /** The top level; groups hold the next level in one of `optionGroupChildren`. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    /** Field (dotted path) holding a choosable option's text. */
    optionLabel?: string;
    /** Field holding the value v-model receives. Without it, the whole option is the value. */
    optionValue?: string;
    optionDisabled?: string;
    /** Field holding a group's text. */
    optionGroupLabel?: string;
    /** The field, or the fields, one per level, that hold a group's children. Defaults to `items`. */
    optionGroupChildren?: string | string[];
    /** Compare object values by this field instead of structurally. */
    dataKey?: string;
    placeholder?: string;
    showClear?: boolean;
    loading?: boolean;
    emptyMessage?: string;
    disabled?: boolean;
    invalid?: boolean;
    size?: Size;
    variant?: InputVariant;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type CascadeSelectEmits = {
    change: [event: { originalEvent?: Event; value: unknown }];
    'group-change': [event: { originalEvent?: Event; value: unknown }];
    show: [];
    hide: [];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface CascadeSelectSlots {
    value?: (props: { value: unknown; option: unknown; placeholder?: string }) => unknown;
    option?: (props: { option: unknown; level: number; group: boolean; selected: boolean; focused: boolean }) => unknown;
    empty?: () => unknown;
    dropdownicon?: (props: { open: boolean }) => unknown;
    optiongroupicon?: () => unknown;
}
