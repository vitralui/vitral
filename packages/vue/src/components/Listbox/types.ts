import type { BaseProps } from '../../base/types';

export interface ListboxProps extends BaseProps {
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
    /** v-model becomes an array, and the list is multi-selectable. */
    multiple?: boolean;
    /** Marks the selected options with a check, as well as with the highlight. */
    checkmark?: boolean;
    /** Adds a search box above the list. */
    filter?: boolean;
    filterPlaceholder?: string;
    /** Fields to search instead of the label. */
    filterFields?: string[];
    /** Any registered match mode; accent- and case-insensitive `contains` by default. */
    filterMatchMode?: string;
    /** The list's maximum height before it scrolls. */
    scrollHeight?: string;
    emptyMessage?: string;
    emptyFilterMessage?: string;
    /**
     * In single mode, moving with the arrows also selects, the way a native
     * list box does. Off, the arrows only move and Enter or Space selects.
     */
    selectOnFocus?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    fluid?: boolean;
}

export interface ListboxChangeEvent {
    originalEvent?: Event;
    value: unknown;
}

export type ListboxEmits = {
    change: [event: ListboxChangeEvent];
    filter: [query: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface ListboxSlots {
    option?: (props: { option: unknown; index: number; selected: boolean; focused: boolean }) => unknown;
    optiongroup?: (props: { group: unknown }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
}
