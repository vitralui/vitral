import type { BaseProps, IconProp, InputVariant, Size } from '../../base/types';

export interface InputTagProps extends BaseProps {
    /** What ends a tag as it is typed, besides Enter. Defaults to a comma. */
    separator?: string | readonly string[];
    /** How many tags the field takes. */
    max?: number;
    /** Keep a tag the list already has. Off by default. */
    allowDuplicate?: boolean;
    /** Add what is in the box when focus leaves the field. On by default. */
    addOnBlur?: boolean;
    /** Refuse a tag: the text stays in the box for the reader to fix. */
    validate?: (tag: string) => boolean;
    placeholder?: string;
    removeIcon?: IconProp;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    /** The name the field is submitted under; the tags are sent one by one. */
    name?: string;
}

export type InputTagEmits = {
    /** A tag was added, by Enter, by a separator, by a paste or on blur. */
    add: [event: { originalEvent: Event; value: string; tags: string[] }];
    /** A tag was taken out, by its button or by a key. */
    remove: [event: { originalEvent: Event; value: string; index: number; tags: string[] }];
    /** Something was refused: the list was full, the tag was already there, or `validate` said no. */
    reject: [event: { originalEvent: Event; value: string; reason: 'duplicate' | 'max' | 'invalid' }];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface InputTagSlots {
    /** Replaces a tag's content, inside the tag's own box. */
    tag?: (props: { value: string; index: number; remove: (event: Event) => void }) => unknown;
    removeicon?: (props: { value: string; index: number }) => unknown;
}
