import type { ClassEntry, EditorColor, EditorContent, EditorNode, Locale } from '@vitral/core';
import type { OverlayTarget } from '@vitral/controls';
import type { PassThrough } from '@vitral/dom';

/**
 * What an editor is told, as plain data. The document, the commands and the
 * history are `@vitral/core`'s; this is the interface around them — which
 * toolbar, which panels, what a host draws itself.
 */

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
    | 'image'
    | 'table'
    | 'horizontalRule'
    | 'link'
    | 'undo'
    | 'redo'
    | 'clear';

/** The commands a plain button can run. */
export type EditorButtonCommand = Exclude<EditorToolbarItem, 'blockType' | 'color' | 'highlight' | 'image' | 'table'>;

/** One entry of the menu a slash opens. */
export interface SlashCommand {
    /** Identifies it, and is what a host matches on. */
    id: string;
    label: string;
    /** A line under the label. */
    description?: string;
    icon?: string;
    /** Words that find it besides its label. */
    keywords?: string[];
    /** A heading the entry sits under. */
    group?: string;
    /** What it does. Without it, `command` is run. */
    run?: (editor: TextEditorHandle) => void;
    /** A command name and its arguments, run against the editor. */
    command?: readonly [string, ...unknown[]];
}

/** What the handle around a block offers. */
export interface BlockAction {
    id: string;
    label: string;
    icon?: string;
    /** Hidden where it does not apply to the block in hand. */
    when?: (block: EditorNode) => boolean;
    run: (editor: TextEditorHandle, block: EditorNode, index: number) => void;
}

/** Content a host draws itself: a string, a node it made, or nothing. */
export type Content = string | number | Node | null | undefined;

/** The parts a host draws itself, instead of what the editor would draw. */
export interface EditorContentHooks {
    /** The whole toolbar. */
    toolbar?: () => Content;
    /** The bar under the content, where the count sits. */
    footer?: () => Content;
}

export interface TextEditorConfig {
    /** The document: HTML, or the JSON a previous editor produced. */
    content?: EditorContent;
    /** The toolbar: `false` for none, or groups of item names. */
    toolbar?: boolean | EditorToolbarItem[][];
    /** A floating toolbar over selected text: `true` for the usual buttons, or the items to show. */
    bubbleMenu?: boolean | EditorToolbarItem[];
    /** The menu a `/` opens at the start of an empty block: `false` for none, or the commands to offer. */
    slashMenu?: boolean | SlashCommand[];
    /** The handle beside the block the caret is in, and what it offers. */
    blockMenu?: boolean | BlockAction[];
    placeholder?: string;
    /** The most characters the document may hold. */
    maxLength?: number | null;
    /** Milliseconds of quiet before an edit starts a new undo step. */
    historyDelay?: number;
    /** Shows the character count (and the limit, where there is one). */
    showCount?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Takes the keyboard as soon as it is drawn. */
    autofocus?: boolean;
    /** The colours the text and highlight pickers offer. */
    palette?: readonly EditorColor[];
    /** Names the text area, where no label points at it. */
    ariaLabel?: string;
    ariaLabelledby?: string;

    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** What the host draws itself. */
    hooks?: EditorContentHooks;
    id?: string;
    nonce?: string;
    cssLayer?: string | false;
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    on?: TextEditorEvents;
}

export interface TextEditorEvents {
    /** The document changed: the HTML, the JSON and the plain text of it. */
    change?: (value: { html: string; json: EditorNode; text: string }) => void;
    /** The selection moved. */
    'selection-change'?: (event: { empty: boolean; source: 'user' | 'api' | 'history' }) => void;
    focus?: (event: FocusEvent) => void;
    blur?: (event: FocusEvent) => void;
}

/** The editor, as the outside sees it. */
export interface TextEditorHandle {
    update(config: Partial<TextEditorConfig>): void;
    /** The document as HTML. */
    getHTML(): string;
    getJSON(): EditorNode;
    getText(): string;
    getMarkdown(): string;
    setContent(content: EditorContent): void;
    /** Types text where the caret is, Markdown shortcuts and all. */
    typeText(text: string): boolean;
    /** Runs one of the editor's commands by name. */
    run(name: string, ...args: unknown[]): boolean;
    can(name: string, ...args: unknown[]): boolean;
    isActive(name: string, attrs?: Record<string, unknown>): boolean;
    focus(): void;
    /** Draws again, for anything that changed underneath. */
    refresh(): void;
    destroy(): void;
    readonly element: HTMLElement;
}
