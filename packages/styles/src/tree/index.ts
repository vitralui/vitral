import { defineStyle } from '../defineStyle';
import css from './tree.css?raw';

export interface TreeNodeState {
    selected?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    leaf?: boolean;
}

export interface TreeCheckboxState {
    checked?: boolean;
    partial?: boolean;
}

export const treeStyle = defineStyle({
    name: 'tree',
    css,
    classes: {
        root: 'vt-tree',
        filter: 'vt-field vt-field-sm vt-field-fluid vt-tree-filter',
        filterInput: 'vt-field-input',
        container: 'vt-tree-container',
        node: (s: TreeNodeState) => [
            'vt-tree-node',
            { 'vt-tree-node-selected': s.selected, 'vt-tree-node-expanded': s.expanded, 'vt-tree-node-disabled': s.disabled, 'vt-tree-node-leaf': s.leaf }
        ],
        content: 'vt-tree-node-content',
        toggler: (s: TreeNodeState) => ['vt-tree-toggler', { 'vt-tree-toggler-leaf': s.leaf }],
        togglerIcon: 'vt-tree-toggler-icon',
        checkbox: (s: TreeCheckboxState) => ['vt-tree-checkbox', { 'vt-tree-checkbox-checked': s.checked, 'vt-tree-checkbox-partial': s.partial }],
        checkboxIcon: 'vt-tree-checkbox-icon',
        nodeIcon: 'vt-tree-node-icon',
        label: 'vt-tree-node-label',
        group: 'vt-tree-group',
        loading: 'vt-tree-loading',
        empty: 'vt-tree-empty'
    }
});
