// The rich-text engine: a document model, pure commands, history, input rules,
// HTML/JSON/Markdown formats and a view over a contenteditable element. The
// names are prefixed, because they share the package's namespace.
export {
    editorNodes,
    normalizeDoc as normalizeEditorDoc,
    inlineText as editorInlineText,
    textblocks as editorTextblocks,
    comparePositions as compareEditorPositions,
    nodeAt as editorNodeAt,
    type EditorNodeType,
    type EditorMarkType,
    type EditorMarkAttrs,
    type EditorMark,
    type EditorNodeAttrs,
    type EditorNode,
    type EditorPath,
    type EditorPosition
} from './model';
export {
    createState as createEditorState,
    selectionRange as editorSelectionRange,
    startOfDoc as startOfEditorDoc,
    endOfDoc as endOfEditorDoc,
    type EditorSelection,
    type EditorState,
    type EditorCommand
} from './state';
export {
    isActive as isEditorActive,
    activeMark as activeEditorMark,
    activeBlockType as activeEditorBlockType,
    linkAt as editorLinkAt,
    deleteRange as editorDeleteRange,
    type EditorLinkInfo,
    type DeleteUnit as EditorDeleteUnit
} from './commands';
export {
    createHistory as createEditorHistory,
    recordHistory as recordEditorHistory,
    undoHistory as undoEditorHistory,
    redoHistory as redoEditorHistory,
    type EditorHistory,
    type EditorEditKind
} from './history';
export { applyInputRules as applyEditorInputRules, applyEnterRule as applyEditorEnterRule } from './inputRules';
export {
    editorKeymap,
    isMacPlatform,
    keyName as editorKeyName,
    formatShortcut as formatEditorShortcut,
    ariaShortcut as ariaEditorShortcut,
    shortcutFor as editorShortcutFor,
    type EditorKeyBinding,
    type EditorKeyEvent
} from './keymap';
export { parseEditorHTML, toEditorHTML, textToEditorDoc, isEmptyDoc as isEmptyEditorDoc, type EditorParseOptions, type EditorHTMLOptions } from './html';
export { toEditorText, toEditorMarkdown, countCharacters as countEditorCharacters, countWords as countEditorWords } from './text';
export { editorDocFromJSON, editorDocToJSON } from './json';
export {
    editorPalette,
    editorColorVar,
    editorColorStyle,
    sanitizeUrl,
    matchPaletteColor as matchEditorPaletteColor,
    sanitizeLanguage as sanitizeCodeLanguage,
    type EditorColor
} from './sanitize';
export * from './editor';
export { createEditorView, type EditorView, type EditorViewOptions } from './view';
