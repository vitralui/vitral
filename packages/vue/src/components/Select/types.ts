import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface SelectProps extends BaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    /** Field (dotted path) holding an option's text. Without it, options are shown as they are. */
    optionLabel?: string;
    /** Field holding the value v-model receives. Without it, the whole option is the value. */
    optionValue?: string;
    optionDisabled?: string;
    /** Turns `options` into groups: this field is each group's label… */
    optionGroupLabel?: string;
    /** …and this one its options. Defaults to `items`. */
    optionGroupChildren?: string;
    /** Compare object values by this field instead of structurally. */
    dataKey?: string;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    size?: Size;
    variant?: InputVariant;
    fluid?: boolean;
    /** Adds a search box to the panel — the combobox. */
    filter?: boolean;
    filterPlaceholder?: string;
    /** Fields to search instead of the label. */
    filterFields?: string[];
    /** Any registered match mode; accent- and case-insensitive `contains` by default. */
    filterMatchMode?: string;
    showClear?: boolean;
    loading?: boolean;
    /** Marks the selected option with a check, as well as with the highlight. */
    checkmark?: boolean;
    emptyMessage?: string;
    emptyFilterMessage?: string;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export interface SelectChangeEvent {
    originalEvent?: Event;
    value: unknown;
}

export type SelectEmits = {
    change: [event: SelectChangeEvent];
    show: [];
    hide: [];
    filter: [query: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface SelectSlots {
    value?: (props: { value: unknown; option: unknown; placeholder?: string }) => unknown;
    option?: (props: { option: unknown; index: number; selected: boolean; focused: boolean }) => unknown;
    optiongroup?: (props: { group: unknown }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    dropdownicon?: (props: { open: boolean }) => unknown;
}
