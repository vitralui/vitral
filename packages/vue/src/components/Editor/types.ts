import type { BlockAction, SlashCommand } from '@vitral/editor';
import type { BaseProps, IconProp, InputVariant, OverlayPlacement } from '../../base/types';

/** A mark in the JSON document. */
export interface EditorJSONMark {
    type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'color' | 'highlight';
    attrs?: { href?: string; target?: string | null; color?: string };
}

/** The JSON document (`v-model:json`): nodes in the ProseMirror/TipTap shape. */
export interface EditorJSON {
    type: string;
    attrs?: { level?: number; language?: string | null; start?: number; checked?: boolean; src?: string; alt?: string; title?: string | null };
    content?: EditorJSON[];
    text?: string;
    marks?: EditorJSONMark[];
}

/** What a toolbar can hold, by name. */
export type EditorToolbarItem =
    | 'blockType'
    | 'paragraph'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'color'
    | 'highlight'
    | 'bulletList'
    | 'orderedList'
    | 'taskList'
    | 'indent'
    | 'outdent'
    | 'blockquote'
    | 'codeBlock'
    | 'horizontalRule'
    | 'link'
    | 'image'
    | 'table'
    | 'undo'
    | 'redo'
    | 'clear';

/** The commands a plain `<EditorButton>` can run. */
export type EditorButtonCommand = Exclude<EditorToolbarItem, 'blockType' | 'color' | 'highlight' | 'image' | 'table'>;

export interface EditorSelectionChangeEvent {
    /** Where the selection starts and ends (anchor and head), as `{ path, offset }` positions. */
    selection: { anchor: { path: number[]; offset: number }; head: { path: number[]; offset: number } };
    /** Nothing selected: a caret. */
    empty: boolean;
    source: 'user' | 'api' | 'history';
}

export interface EditorTextChangeEvent {
    htmlValue: string;
    textValue: string;
    source: 'user' | 'api' | 'history';
}

export interface EditorProps extends BaseProps {
    placeholder?: string;
    /** The text can be read, selected and copied, not changed. */
    readonly?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    /** The most characters the text may hold; typing and pasting stop there. */
    maxLength?: number;
    /** Focuses the text, with the caret at the end, once mounted. */
    autofocus?: boolean;
    /** Palette colour names the colour and highlight pickers offer, in order. Defaults to the whole palette. */
    colors?: string[];
    /** Milliseconds within which consecutive typing is one undo step. Defaults to 500. */
    historyDelay?: number;
    /**
     * The menu a `/` opens where a word starts: `true` for the blocks the
     * editor knows, the commands to offer, or `false` for none. Defaults to
     * true.
     */
    slashMenu?: boolean | SlashCommand[];
    /**
     * The handle beside the block the caret is in: `true` for the usual
     * actions, the actions to offer, or `false` for none. Defaults to true.
     */
    blockMenu?: boolean | BlockAction[];
    /**
     * The toolbar: `false` for none, or groups of item names, as in
     * `[['bold', 'italic'], ['link']]`. The `toolbar` slot replaces it entirely.
     */
    toolbar?: boolean | EditorToolbarItem[][];
    /** A floating toolbar over selected text; `true` for the default buttons, or the items to show. */
    bubbleMenu?: boolean | EditorToolbarItem[];
    /** Shows the word and character count under the text. On by default when there is a `maxLength`. */
    showCount?: boolean;
    /** Shows the word count beside the character count. Defaults to true. */
    showWordCount?: boolean;
}

/** Props of `<EditorRoot>` (`Editor.Root`), the part that owns the editor and its model. */
export type EditorRootProps = Omit<EditorProps, 'toolbar' | 'bubbleMenu' | 'showCount' | 'showWordCount'>;

export type { BlockAction, SlashCommand };

export type EditorEmits = {
    'update:modelValue': [value: string];
    'update:json': [value: EditorJSON];
    /** The content changed. */
    'text-change': [event: EditorTextChangeEvent];
    'selection-change': [event: EditorSelectionChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    /** The editor is ready; `instance` is the framework-free editor behind the component. */
    load: [event: { instance: unknown }];
};

/** The events `<EditorRoot>` declares besides its two models. */
export type EditorRootEmits = {
    'text-change': [event: EditorTextChangeEvent];
    'selection-change': [event: EditorSelectionChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    load: [event: { instance: unknown }];
};

export interface EditorSlots {
    /** Replaces the toolbar. Build one from `EditorToolbar`, `EditorButton` and the other parts. */
    toolbar?: () => unknown;
    /** Replaces the footer's content (the count). */
    footer?: () => unknown;
}

export interface EditorToolbarProps extends BaseProps {
    /** Groups of item names; the default slot replaces them. */
    items?: EditorToolbarItem[][];
    /** Names the toolbar; defaults to the locale's. */
    ariaLabel?: string;
}

export interface EditorToolbarGroupProps extends BaseProps {
    /** Names the group, when it needs one. */
    ariaLabel?: string;
}

export interface EditorButtonProps extends BaseProps {
    /** What the button does; it also picks the icon, name, shortcut and pressed state. */
    command: EditorButtonCommand;
    /** Replaces the icon. */
    icon?: IconProp;
    /** Replaces the accessible name (and tooltip). */
    label?: string;
    /** Shows the label beside the icon. */
    showLabel?: boolean;
}

export interface EditorColorPickerProps extends BaseProps {
    /** A text colour or a highlight. Defaults to `'color'`. */
    kind?: 'color' | 'highlight';
    icon?: IconProp;
    label?: string;
}

export interface EditorBlockSelectProps extends BaseProps {
    /** The block types offered. Defaults to paragraph, three heading levels and code. */
    options?: ('paragraph' | 'heading1' | 'heading2' | 'heading3' | 'codeBlock')[];
    label?: string;
}

export interface EditorIconButtonProps extends BaseProps {
    icon?: IconProp;
    label?: string;
}

export interface EditorContentProps extends BaseProps {}

export interface EditorBubbleMenuProps extends BaseProps {
    /** The buttons shown; the default slot replaces them. */
    items?: EditorToolbarItem[];
    placement?: OverlayPlacement;
}

export interface EditorFooterProps extends BaseProps {}

export interface EditorCountProps extends BaseProps {
    /** Shows the word count beside the characters. Defaults to true. */
    words?: boolean;
    /** Shows the character count. Defaults to true. */
    characters?: boolean;
}
