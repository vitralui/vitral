import { defineStyle } from '../defineStyle';
import css from './spreadsheet.css?raw';

export interface SpreadsheetCellState {
    /** Numbers read down a column, so they sit at its trailing edge. */
    kind?: 'text' | 'number' | 'error';
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
}

/** How many colours the outlines cycle through before starting again. */
const REFERENCE_COLOURS = 5;

export const spreadsheetStyle = defineStyle({
    name: 'spreadsheet',
    css,
    classes: {
        root: (s: { readonly?: boolean; editing?: boolean }) => [
            'vt-spreadsheet',
            { 'vt-spreadsheet-readonly': s.readonly, 'vt-spreadsheet-editing': s.editing }
        ],
        toolbar: 'vt-spreadsheet-toolbar',
        toolbarGroup: 'vt-spreadsheet-toolbar-group',
        button: (s: { active?: boolean; disabled?: boolean }) => [
            'vt-spreadsheet-button',
            { 'vt-spreadsheet-button-active': s.active, 'vt-spreadsheet-button-disabled': s.disabled }
        ],
        buttonIcon: 'vt-spreadsheet-button-icon',
        bar: 'vt-spreadsheet-bar',
        address: 'vt-spreadsheet-address',
        formula: 'vt-spreadsheet-formula',
        grid: 'vt-spreadsheet-grid',
        corner: 'vt-spreadsheet-corner',
        columns: 'vt-spreadsheet-columns',
        rows: 'vt-spreadsheet-rows',
        track: 'vt-spreadsheet-track',
        viewport: 'vt-spreadsheet-viewport',
        sizer: 'vt-spreadsheet-sizer',
        line: 'vt-spreadsheet-line',
        column: (s: { active?: boolean }) => ['vt-spreadsheet-column', { 'vt-spreadsheet-header-active': s.active }],
        row: (s: { active?: boolean }) => ['vt-spreadsheet-row', { 'vt-spreadsheet-header-active': s.active }],
        resizer: (s: { axis?: 'column' | 'row'; dragging?: boolean }) => [
            'vt-spreadsheet-resizer',
            `vt-spreadsheet-resizer-${s.axis ?? 'column'}`,
            { 'vt-spreadsheet-resizer-dragging': s.dragging }
        ],
        cell: (s: SpreadsheetCellState) => [
            'vt-spreadsheet-cell',
            {
                'vt-spreadsheet-cell-number': s.align ? s.align === 'right' : s.kind === 'number',
                'vt-spreadsheet-cell-center': s.align === 'center',
                'vt-spreadsheet-cell-error': s.kind === 'error',
                'vt-spreadsheet-cell-bold': s.bold,
                'vt-spreadsheet-cell-italic': s.italic
            }
        ],
        /** One per rectangle a formula being typed mentions, coloured in the order they were written. */
        reference: (s: { index?: number }) => ['vt-spreadsheet-reference', `vt-spreadsheet-reference-${((s.index ?? 0) % REFERENCE_COLOURS) + 1}`],
        range: 'vt-spreadsheet-range',
        active: 'vt-spreadsheet-active',
        handle: 'vt-spreadsheet-handle',
        editor: 'vt-spreadsheet-editor'
    }
});
