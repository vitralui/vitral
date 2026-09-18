import { defineStyle } from '../defineStyle';
import css from './treetable.css?raw';

export interface TreeTableState {
    striped?: boolean;
    gridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
}

const align = (s: { align?: string }) => ({ 'vt-treetable-align-center': s.align === 'center', 'vt-treetable-align-right': s.align === 'right' });

export const treetableStyle = defineStyle({
    name: 'treetable',
    css,
    classes: {
        root: (s: TreeTableState) => [
            'vt-treetable',
            {
                'vt-treetable-striped': s.striped,
                'vt-treetable-gridlines': s.gridlines,
                'vt-treetable-sm': s.size === 'small',
                'vt-treetable-lg': s.size === 'large',
                'vt-treetable-scrollable': s.scrollable
            }
        ],
        header: 'vt-treetable-header',
        footer: 'vt-treetable-footer',
        tableContainer: 'vt-treetable-table-container',
        table: 'vt-treetable-table',
        caption: 'vt-sr-only',
        thead: 'vt-treetable-thead',
        headerRow: 'vt-treetable-header-row',
        headerCell: (s: { align?: string }) => ['vt-treetable-header-cell', align(s)],
        sortButton: 'vt-treetable-sort-button',
        sortIcon: (s: { active?: boolean }) => ['vt-treetable-sort-icon', { 'vt-treetable-sort-icon-active': s.active }],
        tbody: 'vt-treetable-tbody',
        row: (s: { selectable?: boolean; selected?: boolean }) => ['vt-treetable-row', { 'vt-treetable-row-selectable': s.selectable, 'vt-treetable-row-selected': s.selected }],
        bodyCell: (s: { align?: string }) => ['vt-treetable-body-cell', align(s)],
        node: 'vt-treetable-node',
        toggler: (s: { leaf?: boolean; open?: boolean }) => ['vt-treetable-toggler', { 'vt-treetable-toggler-leaf': s.leaf, 'vt-treetable-toggler-open': s.open }],
        togglerIcon: 'vt-treetable-toggler-icon',
        checkbox: (s: { checked?: boolean; partial?: boolean }) => ['vt-treetable-checkbox', { 'vt-treetable-checkbox-on': s.checked || s.partial }],
        emptyCell: 'vt-treetable-empty-cell',
        paginator: 'vt-treetable-paginator',
        loadingMask: 'vt-treetable-loading-mask'
    }
});
