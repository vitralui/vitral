import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface MultiSelectProps extends BaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    /** Field (dotted path) holding an option's text. Without it, options are shown as they are. */
    optionLabel?: string;
    /** Field holding the value v-model collects. Without it, the whole option is the value. */
    optionValue?: string;
    optionDisabled?: string;
    /** Turns `options` into groups: this field is each group's label… */
    optionGroupLabel?: string;
    /** …and this one its options. Defaults to `items`. */
    optionGroupChildren?: string;
    /** Compare object values by this field instead of structurally. */
    dataKey?: string;
    placeholder?: string;
    /** How the choice is shown: a comma-separated list (the default) or chips. */
    display?: 'comma' | 'chip';
    /** Past this many, the field says how many are chosen instead of naming them. */
    maxSelectedLabels?: number;
    /** What it says then. `{count}`; defaults to the locale's selection message. */
    selectedItemsLabel?: string;
    /** No more than this many may be chosen. */
    selectionLimit?: number;
    /** Show the select-all box in the header. Defaults to true. */
    showToggleAll?: boolean;
    /** Adds a search box to the panel. */
    filter?: boolean;
    filterPlaceholder?: string;
    /** Fields to search instead of the label. */
    filterFields?: string[];
    /** Any registered match mode; accent- and case-insensitive `contains` by default. */
    filterMatchMode?: string;
    /** Empty the search box when the panel closes. */
    resetFilterOnHide?: boolean;
    showClear?: boolean;
    loading?: boolean;
    emptyMessage?: string;
    emptyFilterMessage?: string;
    disabled?: boolean;
    invalid?: boolean;
    size?: Size;
    variant?: InputVariant;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export interface MultiSelectChangeEvent {
    originalEvent?: Event;
    value: unknown[];
}

export type MultiSelectEmits = {
    change: [event: MultiSelectChangeEvent];
    'selectall-change': [event: { originalEvent: Event; checked: boolean }];
    show: [];
    hide: [];
    filter: [query: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface MultiSelectSlots {
    /** The field's content. */
    value?: (props: { value: unknown[]; options: unknown[]; placeholder?: string }) => unknown;
    option?: (props: { option: unknown; index: number; selected: boolean; focused: boolean }) => unknown;
    optiongroup?: (props: { group: unknown }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    dropdownicon?: (props: { open: boolean }) => unknown;
}
