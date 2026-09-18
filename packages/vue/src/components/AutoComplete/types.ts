import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface AutoCompleteProps extends BaseProps {
    /** What the list offers for the current query; the app sets it in answer to `complete`. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suggestions?: any[];
    /** Field (dotted path) holding a suggestion's text. Without it, suggestions are shown as they are. */
    optionLabel?: string;
    optionDisabled?: string;
    /** Turns `suggestions` into groups: this field is each group's label… */
    optionGroupLabel?: string;
    /** …and this one its suggestions. Defaults to `items`. */
    optionGroupChildren?: string;
    /** Compare object values by this field instead of structurally. */
    dataKey?: string;
    /** v-model becomes an array, shown as chips in the field. */
    multiple?: boolean;
    /** Adds a button that asks for the whole list. */
    dropdown?: boolean;
    /** What the button asks for: every suggestion (`'blank'`, the default) or those matching the current text. */
    dropdownMode?: 'blank' | 'current';
    /** Only a chosen suggestion may stay in the box; other text is cleared when it loses focus. */
    forceSelection?: boolean;
    /** Milliseconds to wait after typing before asking. Defaults to 300. */
    delay?: number;
    /** Characters to type before asking. Defaults to 1. */
    minLength?: number;
    /** Ask as soon as the box takes focus. */
    completeOnFocus?: boolean;
    /** Put the first suggestion in focus when the list opens, so Enter takes it. */
    autoOptionFocus?: boolean;
    /** Shows a clear button while there is a value. */
    showClear?: boolean;
    /** Shows a spinner, for while the app is searching. */
    loading?: boolean;
    /** Say so when nothing matches, rather than keeping the list closed. Defaults to true. */
    showEmptyMessage?: boolean;
    emptySearchMessage?: string;
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

export interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

export interface AutoCompleteOptionEvent {
    originalEvent: Event;
    value: unknown;
}

export type AutoCompleteEmits = {
    /** Asks the app for the suggestions matching `query`. */
    complete: [event: AutoCompleteCompleteEvent];
    'option-select': [event: AutoCompleteOptionEvent];
    'option-unselect': [event: AutoCompleteOptionEvent];
    'dropdown-click': [event: AutoCompleteCompleteEvent];
    clear: [];
    show: [];
    hide: [];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface AutoCompleteSlots {
    option?: (props: { option: unknown; index: number; selected: boolean; focused: boolean }) => unknown;
    optiongroup?: (props: { group: unknown }) => unknown;
    /** A chip's content in multiple mode. */
    chip?: (props: { value: unknown; label: string; remove: (event: Event) => void }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    dropdownicon?: () => unknown;
}
