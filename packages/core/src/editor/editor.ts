import * as cmd from './commands';
import { closeHistoryGroup, createHistory, recordHistory, redoHistory, undoHistory, type EditorEditKind, type EditorHistory } from './history';
import { isEmptyDoc, parseEditorHTML, textToEditorDoc, toEditorHTML } from './html';
import { applyEnterRule, applyInputRules } from './inputRules';
import { editorDocFromJSON, editorDocToJSON } from './json';
import { type EditorMarkAttrs, type EditorNode, type EditorNodeAttrs } from './model';
import { editorPalette, type EditorColor } from './sanitize';
import { clampSelection, createState, sameSelection, type EditorSelection, type EditorState } from './state';
import { countCharacters, countWords, toEditorMarkdown, toEditorText } from './text';

/**
 * Every command an editor runs, by name. Each takes the state first and
 * returns the next state or null; `editor.commands.x(...)` supplies the state.
 */
export const editorCommands = {
    insertText: cmd.insertText,
    insertHardBreak: cmd.insertHardBreak,
    deleteSelection: cmd.deleteSelection,
    deleteBackward: cmd.deleteBackward,
    deleteForward: cmd.deleteForward,
    deleteBetween: cmd.deleteBetween,
    deleteNode: cmd.deleteNode,
    joinBackward: cmd.joinBackward,
    joinForward: cmd.joinForward,
    splitBlock: cmd.splitBlock,
    setParagraph: (s: EditorState) => cmd.setBlockType(s, 'paragraph'),
    setHeading: (s: EditorState, level: number) => cmd.setBlockType(s, 'heading', { level }),
    toggleHeading: (s: EditorState, level: number) => cmd.toggleBlockType(s, 'heading', { level }),
    setCodeBlock: (s: EditorState, language?: string | null) => cmd.setBlockType(s, 'codeBlock', { language }),
    toggleCodeBlock: (s: EditorState, language?: string | null) => cmd.toggleBlockType(s, 'codeBlock', { language }),
    setBlockType: cmd.setBlockType,
    toggleBlockType: cmd.toggleBlockType,
    setCodeBlockLanguage: cmd.setCodeBlockLanguage,
    toggleMark: cmd.toggleMark,
    setMark: cmd.setMark,
    unsetMark: cmd.unsetMark,
    toggleBold: (s: EditorState) => cmd.toggleMark(s, 'bold'),
    toggleItalic: (s: EditorState) => cmd.toggleMark(s, 'italic'),
    toggleUnderline: (s: EditorState) => cmd.toggleMark(s, 'underline'),
    toggleStrike: (s: EditorState) => cmd.toggleMark(s, 'strike'),
    toggleCode: (s: EditorState) => cmd.toggleMark(s, 'code'),
    setColor: cmd.setColor,
    setHighlight: cmd.setHighlight,
    setLink: cmd.setLink,
    unsetLink: cmd.unsetLink,
    toggleList: cmd.toggleList,
    toggleBulletList: (s: EditorState) => cmd.toggleList(s, 'bulletList'),
    toggleOrderedList: (s: EditorState) => cmd.toggleList(s, 'orderedList'),
    toggleTaskList: (s: EditorState) => cmd.toggleList(s, 'taskList'),
    toggleTaskItem: cmd.toggleTaskItem,
    toggleBlockquote: cmd.toggleBlockquote,
    sinkListItem: cmd.sinkListItem,
    liftListItem: cmd.liftListItem,
    /** Tab: indents a list item or code, or moves to the next table cell. */
    indent: (s: EditorState) => cmd.indentCode(s) ?? (cmd.isActive(s, 'table') ? cmd.goToCell(s, 1) : cmd.sinkListItem(s)),
    /** Shift+Tab: the reverse. */
    outdent: (s: EditorState) => cmd.outdentCode(s) ?? (cmd.isActive(s, 'table') ? cmd.goToCell(s, -1) : cmd.liftListItem(s)),
    insertHorizontalRule: cmd.insertHorizontalRule,
    insertImage: cmd.insertImage,
    insertBlock: cmd.insertBlock,
    insertTable: cmd.insertTable,
    addRowBefore: (s: EditorState) => cmd.addRow(s, false),
    addRowAfter: (s: EditorState) => cmd.addRow(s, true),
    addColumnBefore: (s: EditorState) => cmd.addColumn(s, false),
    addColumnAfter: (s: EditorState) => cmd.addColumn(s, true),
    deleteRow: cmd.deleteRow,
    deleteColumn: cmd.deleteColumn,
    deleteTable: cmd.deleteTable,
    goToNextCell: (s: EditorState) => cmd.goToCell(s, 1),
    goToPreviousCell: (s: EditorState) => cmd.goToCell(s, -1),
    clearFormatting: cmd.clearFormatting,
    insertContent: cmd.insertContent,
    selectAll: cmd.selectAll,
    setSelection: cmd.setSelection
};

type Tail<T> = T extends [unknown, ...infer Rest] ? Rest : never;

export type EditorCommandMap = typeof editorCommands;
export type EditorCommandName = keyof EditorCommandMap | 'undo' | 'redo';
export type EditorCommandArgs<K extends EditorCommandName> = K extends keyof EditorCommandMap ? Tail<Parameters<EditorCommandMap[K]>> : [];

/** `editor.commands`: each command bound to the editor, returning whether it ran. */
export type EditorBoundCommands = { [K in EditorCommandName]: (...args: EditorCommandArgs<K>) => boolean };

/** Where a change came from: typing and the like, the application's code, or undo/redo. */
export type EditorChangeOrigin = 'user' | 'api' | 'history';

export interface EditorUpdate {
    state: EditorState;
    previous: EditorState;
    docChanged: boolean;
    selectionChanged: boolean;
    origin: EditorChangeOrigin;
}

export type EditorContent = string | EditorNode | null | undefined;

export interface EditorOptions {
    /** HTML, or a JSON document. */
    content?: EditorContent;
    /** The most characters the text may hold; edits that would pass it are refused. */
    maxLength?: number | null;
    palette?: readonly EditorColor[];
    /** Milliseconds within which consecutive typing is one undo step. */
    historyDelay?: number;
    onUpdate?: (update: EditorUpdate) => void;
}

export interface EditorApplyOptions {
    origin?: EditorChangeOrigin;
    /** How the change joins the undo stack; `false` keeps it out. */
    history?: EditorEditKind | false;
}

export interface EditorInstance {
    readonly state: EditorState;
    readonly palette: readonly EditorColor[];
    /** Every command, bound: `editor.commands.toggleBold()`. */
    readonly commands: EditorBoundCommands;
    /** Runs a command by name; false when it did not apply (or was refused). */
    run<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean;
    /** Whether a command would apply now, without running it. */
    can<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean;
    isActive(name: string, attrs?: EditorMarkAttrs & EditorNodeAttrs): boolean;
    /** Replaces the state; the way a view and custom commands apply a change. */
    apply(next: EditorState | null, options?: EditorApplyOptions): boolean;
    undo(): boolean;
    redo(): boolean;
    /** Text typed by the user: inserted, then Markdown shortcuts applied (as a step of their own). */
    typeText(text: string): boolean;
    /** Enter pressed by the user. */
    enter(): boolean;
    /** Backspace pressed by the user; straight after a Markdown shortcut it gives back what was typed. */
    backspace(unit?: cmd.DeleteUnit): boolean;
    setSelection(selection: EditorSelection): void;
    setContent(content: EditorContent, options?: { emit?: boolean; resetHistory?: boolean; keepSelection?: boolean }): void;
    getHTML(): string;
    getJSON(): EditorNode;
    getText(): string;
    getMarkdown(): string;
    isEmpty(): boolean;
    characterCount(): number;
    wordCount(): number;
    maxLength: number | null;
    subscribe(listener: (update: EditorUpdate) => void): () => void;
    /** Ends the current undo group, so the next edit is a step of its own. */
    closeHistoryGroup(): void;
}

/** Reads HTML or JSON content into a document. */
export function readEditorContent(content: EditorContent, palette: readonly EditorColor[] = editorPalette): EditorNode {
    if (content === null || content === undefined || content === '') return { type: 'doc', content: [] };
    if (typeof content === 'string') return parseEditorHTML(content, { palette });
    return editorDocFromJSON(content, { palette });
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * A framework-free editor: the state, the undo history, the commands and the
 * output formats. A view (`createEditorView`) connects it to an element; a
 * component wraps both.
 */
export function createEditor(options: EditorOptions = {}): EditorInstance {
    const palette = options.palette ?? editorPalette;
    let state = createState(readEditorContent(options.content, palette));
    let history: EditorHistory = createHistory();
    const listeners = new Set<(update: EditorUpdate) => void>();
    if (options.onUpdate) listeners.add(options.onUpdate);
    /** The state a Markdown shortcut rewrote, and the one it made, so Backspace can give the typing back. */
    let lastRule: { made: EditorState } | null = null;
    let characters: { doc: EditorNode; count: number } | null = null;

    const count = (doc: EditorNode) => {
        if (characters?.doc !== doc) characters = { doc, count: countCharacters(doc) };
        return characters.count;
    };

    function emit(previous: EditorState, origin: EditorChangeOrigin) {
        const update: EditorUpdate = { state, previous, docChanged: previous.doc !== state.doc, selectionChanged: !sameSelection(previous.selection, state.selection), origin };
        for (const listener of [...listeners]) listener(update);
    }

    function apply(next: EditorState | null, opts: EditorApplyOptions = {}): boolean {
        if (!next) return false;
        const previous = state;
        if (next === previous) return true;
        if (next.doc !== previous.doc && editor.maxLength != null) {
            const after = count(next.doc);
            if (after > editor.maxLength && after > count(previous.doc)) return false;
        }
        if (next.doc !== previous.doc && opts.history !== false) {
            history = recordHistory(history, previous, next, opts.history ?? 'other', now(), { groupDelay: options.historyDelay });
        }
        state = { ...next, selection: clampSelection(next.doc, next.selection) };
        lastRule = null;
        emit(previous, opts.origin ?? 'api');
        return true;
    }

    function run<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean {
        if (name === 'undo') return undo();
        if (name === 'redo') return redo();
        const fn = editorCommands[name as keyof EditorCommandMap] as unknown as ((s: EditorState, ...a: unknown[]) => EditorState | null) | undefined;
        if (!fn) return false;
        return apply(fn(state, ...args), { origin: 'user' });
    }

    function can<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean {
        if (name === 'undo') return history.done.length > 0;
        if (name === 'redo') return history.undone.length > 0;
        const fn = editorCommands[name as keyof EditorCommandMap] as unknown as ((s: EditorState, ...a: unknown[]) => EditorState | null) | undefined;
        return !!fn && fn(state, ...args) !== null;
    }

    function undo(): boolean {
        const result = undoHistory(history, state);
        if (!result) return false;
        const previous = state;
        history = result.history;
        state = { ...result.state, selection: clampSelection(result.state.doc, result.state.selection) };
        lastRule = null;
        emit(previous, 'history');
        return true;
    }

    function redo(): boolean {
        const result = redoHistory(history, state);
        if (!result) return false;
        const previous = state;
        history = result.history;
        state = { ...result.state, selection: clampSelection(result.state.doc, result.state.selection) };
        lastRule = null;
        emit(previous, 'history');
        return true;
    }

    const commands = new Proxy({} as EditorBoundCommands, {
        get: (_target, name: string) => (...args: unknown[]) => (run as (n: string, ...a: unknown[]) => boolean)(name, ...args)
    });

    const editor: EditorInstance = {
        get state() {
            return state;
        },
        palette,
        commands,
        maxLength: options.maxLength ?? null,
        run,
        can,
        isActive: (name, attrs) => cmd.isActive(state, name, attrs),
        apply,
        undo,
        redo,
        typeText(text) {
            if (!apply(cmd.insertText(state, text), { origin: 'user', history: 'typing' })) return false;
            const ruled = applyInputRules(state, text);
            if (ruled) {
                history = closeHistoryGroup(history);
                if (apply(ruled, { origin: 'user', history: 'other' })) lastRule = { made: state };
            }
            return true;
        },
        enter() {
            const ruled = applyEnterRule(state);
            if (ruled) return apply(ruled, { origin: 'user' });
            history = closeHistoryGroup(history);
            return apply(cmd.splitBlock(state), { origin: 'user' });
        },
        backspace(unit = 'char') {
            if (lastRule && lastRule.made === state) return undo();
            return apply(cmd.deleteBackward(state, unit), { origin: 'user', history: 'delete' });
        },
        setSelection(selection) {
            const next = clampSelection(state.doc, selection);
            if (sameSelection(next, state.selection)) return;
            const previous = state;
            state = { ...state, selection: next, storedMarks: null };
            lastRule = null;
            history = closeHistoryGroup(history);
            emit(previous, 'user');
        },
        setContent(content, opts = {}) {
            const previous = state;
            state = createState(readEditorContent(content, palette), opts.keepSelection ? previous.selection : undefined);
            if (opts.resetHistory !== false) history = createHistory();
            lastRule = null;
            if (opts.emit !== false) emit(previous, 'api');
        },
        getHTML: () => toEditorHTML(state.doc, { palette }),
        getJSON: () => editorDocToJSON(state.doc),
        getText: () => toEditorText(state.doc),
        getMarkdown: () => toEditorMarkdown(state.doc),
        isEmpty: () => isEmptyDoc(state.doc),
        characterCount: () => count(state.doc),
        wordCount: () => countWords(state.doc),
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        closeHistoryGroup() {
            history = closeHistoryGroup(history);
        }
    };
    return editor;
}

/** Plain text read as editor content (one paragraph per line). */
export const editorContentFromText = (text: string): EditorNode => textToEditorDoc(text);

