import type { BaseProps } from '../../base/types';

export interface CommandProps extends BaseProps {
    /** Hide the items the search does not match. Off, the app filters (and renders only what matches). Defaults to true. */
    shouldFilter?: boolean;
    /**
     * Scores an item against the search: 0 (or false) hides it, and higher
     * scores come first. Defaults to core's `commandScore` — whole text, then
     * prefix, word start, anywhere, and letters in order — over the value and
     * keywords, ignoring case and accents.
     */
    filter?: (value: string, search: string, keywords: string[]) => number | boolean;
    /** Wrap from the last item to the first with the arrows. */
    loop?: boolean;
    /** Names the list. Defaults to the locale's "Command palette". */
    label?: string;
}

export type CommandEmits = {
    /** An item was chosen, by Enter or a press. */
    select: [value: string];
};

export interface CommandInputProps extends BaseProps {
    placeholder?: string;
}

export type CommandListProps = BaseProps;

export interface CommandGroupProps extends BaseProps {
    /** The group's heading; it names the group. */
    heading?: string;
    /** Always show the group, even when nothing in it matches. */
    forceMount?: boolean;
}

export interface CommandItemProps extends BaseProps {
    /** What the search matches and `select` reports. Defaults to the item's text. */
    value?: string;
    /** More words the search should match. */
    keywords?: string[];
    disabled?: boolean;
    /** Always show the item, whatever the search. */
    forceMount?: boolean;
    /** Text shown at the end of the item, e.g. `⌘K`. */
    shortcut?: string;
}

export type CommandItemEmits = {
    select: [value: string];
};

export type CommandEmptyProps = BaseProps;
export type CommandSeparatorProps = BaseProps;

export interface CommandDialogProps extends CommandProps {
    /** A letter that opens the dialog with Ctrl (or ⌘), from anywhere in the page: `'k'`. */
    hotkey?: string;
}

export interface CommandSlots {
    default?: () => unknown;
}
