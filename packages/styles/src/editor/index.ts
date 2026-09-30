import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './editor.css?raw';

export interface EditorState extends FieldState {
    readonly?: boolean;
}

export interface EditorButtonState {
    active?: boolean;
    disabled?: boolean;
    /** A button that shows its label (the block-type picker). */
    wide?: boolean;
}

export const editorStyle = defineStyle({
    name: 'editor',
    css,
    classes: {
        root: (s: EditorState) => [fieldClasses(s), 'vt-editor', { 'vt-editor-readonly': s.readonly }],
        toolbar: 'vt-editor-toolbar',
        toolbarGroup: 'vt-editor-toolbar-group',
        button: (s: EditorButtonState) => ['vt-editor-button', { 'vt-editor-button-active': s.active, 'vt-editor-button-wide': s.wide }],
        buttonIcon: 'vt-editor-button-icon',
        buttonLabel: 'vt-editor-button-label',
        buttonChevron: 'vt-editor-button-chevron',
        colorBar: 'vt-editor-color-bar',
        content: 'vt-editor-content',
        /** Toggled on the content while the document is empty; it shows the placeholder. */
        contentEmpty: 'vt-editor-content-empty',
        /** On a selected image or rule. */
        selectedNode: 'vt-editor-node-selected',
        /** An inline chip, by its kind: a mention, a tag, a variable. */
        chip: (s: { kind?: string | null }) => ['vt-editor-chip', s.kind && `vt-editor-chip-${s.kind}`],
        /** A formula in the text: drawn, or showing its source while the renderer is on its way. */
        math: (s: { display?: boolean; pending?: boolean }) => ['vt-editor-math', { 'vt-editor-math-display': s.display, 'vt-editor-math-pending': s.pending }],
        /** The box over a value of a formula being edited where it stands. */
        mathInput: 'vt-editor-math-input',
        /** The formula panel: the formula drawn, and the ready-made ones on their buttons. */
        mathPanel: 'vt-overlay vt-editor-math-panel',
        mathPreview: (s: { empty?: boolean }) => ['vt-editor-math-preview', { 'vt-editor-math-preview-empty': s?.empty }],
        mathTemplates: 'vt-editor-math-templates',
        mathTemplate: 'vt-editor-math-template',
        /** The invisible element popups anchor to at the selection. */
        caret: 'vt-editor-caret',
        instructions: 'vt-sr-only',
        footer: 'vt-editor-footer',
        count: (s: { limit?: boolean }) => ['vt-editor-count', { 'vt-editor-count-limit': s.limit }],
        bubble: 'vt-overlay vt-editor-bubble',
        panel: 'vt-editor-panel',
        /** The find bar over the text, its rows, its option toggles and the count. */
        find: 'vt-editor-find',
        findRow: (s: { replace?: boolean }) => ['vt-editor-find-row', { 'vt-editor-find-row-replace': s.replace }],
        findToggle: (s: { active?: boolean }) => ['vt-editor-button', 'vt-editor-find-toggle', { 'vt-editor-button-active': s.active }],
        findCount: (s: { empty?: boolean }) => ['vt-editor-find-count', { 'vt-editor-find-count-empty': s.empty }],
        field: 'vt-editor-field',
        fieldLabel: 'vt-editor-field-label',
        fieldHint: 'vt-editor-field-hint',
        fieldError: 'vt-editor-field-error',
        check: 'vt-editor-check',
        actions: 'vt-editor-actions',
        swatches: 'vt-editor-swatches',
        /** The menu a slash opens, and what is in it. */
        slashMenu: 'vt-overlay vt-editor-slash',
        slashList: 'vt-option-list vt-editor-slash-list',
        slashItem: (s: { focused?: boolean }) => ['vt-editor-slash-item', { 'vt-editor-slash-item-focused': s.focused }],
        slashIcon: 'vt-editor-slash-icon',
        slashText: 'vt-editor-slash-text',
        slashLabel: 'vt-editor-slash-label',
        slashDescription: 'vt-editor-slash-description',
        slashEmpty: 'vt-option-empty vt-editor-slash-empty',
        /** The handle beside a block, and the menu it opens. */
        blockHandle: 'vt-editor-block-handle',
        blockHandleIcon: 'vt-editor-block-handle-icon',
        blockMenu: 'vt-overlay vt-editor-block-menu',
        blockItem: 'vt-editor-block-item',
        blockIcon: 'vt-editor-block-icon',
        swatch: (s: { selected?: boolean; none?: boolean; kind?: 'color' | 'highlight' }) => [
            'vt-editor-swatch',
            { 'vt-editor-swatch-selected': s.selected, 'vt-editor-swatch-none': s.none, 'vt-editor-swatch-highlight': s.kind === 'highlight' }
        ]
    }
});
