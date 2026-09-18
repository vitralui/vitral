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
        /** The invisible element popups anchor to at the selection. */
        caret: 'vt-editor-caret',
        instructions: 'vt-sr-only',
        footer: 'vt-editor-footer',
        count: (s: { limit?: boolean }) => ['vt-editor-count', { 'vt-editor-count-limit': s.limit }],
        bubble: 'vt-overlay vt-editor-bubble',
        panel: 'vt-editor-panel',
        field: 'vt-editor-field',
        fieldLabel: 'vt-editor-field-label',
        fieldHint: 'vt-editor-field-hint',
        fieldError: 'vt-editor-field-error',
        check: 'vt-editor-check',
        actions: 'vt-editor-actions',
        swatches: 'vt-editor-swatches',
        swatch: (s: { selected?: boolean; none?: boolean; kind?: 'color' | 'highlight' }) => [
            'vt-editor-swatch',
            { 'vt-editor-swatch-selected': s.selected, 'vt-editor-swatch-none': s.none, 'vt-editor-swatch-highlight': s.kind === 'highlight' }
        ]
    }
});
