import type { ClassEntry, EditorColor, EditorContent, EditorNode, Locale } from '@vitral/core';
import type { OverlayTarget } from '@vitral/controls';
import type { PassThrough, ScrollbarMode } from '@vitral/dom';

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
    | 'math'
    | 'horizontalRule'
    | 'link'
    | 'undo'
    | 'redo'
    | 'clear'
    | 'find';

/** The commands a plain button can run. */
export type EditorButtonCommand = Exclude<EditorToolbarItem, 'blockType' | 'color' | 'highlight' | 'image' | 'table' | 'math' | 'find'>;

/** One entry of the menu a slash opens. */
/** Something a chip trigger offers: who or what the chip will stand for. */
export interface ChipSuggestion {
    /** What the chip stands for, for the application. */
    id: string;
    /** The words on the chip, and in the list. */
    label: string;
    /** A category the chip's look follows: `'mention'`, `'tag'`, `'variable'`. */
    kind?: string;
    /** A line under the label in the list: an email, a count. */
    description?: string;
    icon?: string;
}

/** A character that, typed at the start of a word, offers chips to put in its place. */
export interface ChipTrigger {
    /** One character: `'@'` for people, `'#'` for tags. Defaults to `'@'`. */
    char?: string;
    /**
     * What to offer for the words typed after the trigger: a list, or a
     * promise of one — a search on the server. A late answer to an older
     * query is thrown away.
     */
    items: (query: string) => ChipSuggestion[] | Promise<ChipSuggestion[]>;
    /** Given to every chip this trigger makes, unless its suggestion says otherwise. */
    kind?: string;
}

/** A formula the formula panel offers ready-made, drawn on a button. */
export interface MathTemplate {
    /** Identifies it, and is what a host matches on. */
    id: string;
    /** What it is called: the button's name. */
    label: string;
    /** What pressing it writes into the formula. */
    latex: string;
}

/** How formulas are edited, where the defaults are not what is wanted. */
export interface EditorMathOptions {
    /** The ready-made formulas the panel offers. The usual ones when left out; none for an empty list. */
    templates?: MathTemplate[];
    /**
     * Whether a number, a letter or a sign of a formula pressed in the text is
     * edited where it stands, in a box over it. On by default; off, a press
     * anywhere on a formula opens the panel with that piece selected.
     */
    inlineEdit?: boolean;
    /**
     * How a formula is written into the HTML the editor hands back:
     * `'drawing'` (the default) puts its drawing inside it, so the HTML shows
     * the formula anywhere, with nothing of Vitral's on the page; `'source'`
     * writes the LaTeX alone, which is far smaller to store, and is drawn
     * where it is shown with `renderMathIn`. Either is read back the same.
     */
    output?: 'drawing' | 'source';
}

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
    run?: (editor: CommandRunner) => void;
    /** A command name and its arguments, run against the editor. */
    command?: readonly [string, ...unknown[]];
}

/** Enough of an editor for an action to act on: the handle, or the engine itself. */
export interface CommandRunner {
    run(name: string, ...args: unknown[]): boolean;
}

/** What the handle around a block offers. */
export interface BlockAction {
    id: string;
    label: string;
    icon?: string;
    /** Hidden where it does not apply to the block in hand. */
    when?: (block: EditorNode) => boolean;
    run: (editor: CommandRunner, block: EditorNode, index: number) => void;
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
    /**
     * Inline chips the reader puts in by typing a trigger: `{ char: '@',
     * items: (q) => people.filter(…) }` for mentions, or several triggers at
     * once. Chips can also be put in with `run('insertChip', { id, label, kind })`.
     */
    chips?: ChipTrigger | ChipTrigger[];
    /**
     * Formulas: the toolbar's formula button, the slash menu's entry, the
     * panel that writes one in LaTeX, and editing one by pressing it in the
     * text. On by default; `false` leaves formulas already in the document
     * drawn and takes every way of making or changing one away. An object says
     * which ready-made formulas the panel offers and whether a value is edited
     * where it stands. One can also be put in with `run('insertMath', { latex })`.
     */
    math?: boolean | EditorMathOptions;
    /**
     * Find and replace: Ctrl/⌘+F opens the bar over the text, Ctrl+H (⌘+⌥+F
     * on a Mac) opens it with the replace row. On by default; `false` leaves
     * those keys to the browser. The `find` toolbar item opens it too.
     */
    find?: boolean;
    /** The most characters the document may hold. */
    maxLength?: number | null;
    /** Milliseconds of quiet before an edit starts a new undo step. */
    historyDelay?: number;
    /**
     * Shows a count under the text: `true` or `'characters'` for characters
     * (and the limit, where there is one), `'words'` for words, `'both'` for both.
     */
    showCount?: boolean | 'characters' | 'words' | 'both';
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
    /**
     * The bars of the text area, when a height makes it scroll: the theme's
     * drawn bars, shown under the pointer (`'hover'`, the default) or always
     * (`'always'`), or the browser's own (`'native'`).
     */
    scrollbar?: ScrollbarMode;
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
    /** The document as HTML. `math` says how formulas are written in this one, whatever the editor's own setting. */
    getHTML(options?: { math?: 'drawing' | 'source' }): string;
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
    /** Opens the find bar, with the replace row and a query when given. */
    openFind(options?: { replace?: boolean; query?: string }): void;
    closeFind(): void;
    /** Draws again, for anything that changed underneath. */
    refresh(): void;
    destroy(): void;
    readonly element: HTMLElement;
}
