import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './treeselect.css?raw';

export interface TreeSelectState extends FieldState {
    open?: boolean;
    placeholder?: boolean;
    chips?: boolean;
}

export const treeselectStyle = defineStyle({
    name: 'treeselect',
    css,
    classes: {
        root: (s: TreeSelectState) => [
            fieldClasses(s),
            'vt-treeselect',
            { 'vt-treeselect-open': s.open, 'vt-treeselect-placeholder': s.placeholder, 'vt-treeselect-chips': s.chips }
        ],
        label: 'vt-treeselect-label',
        chip: 'vt-treeselect-chip',
        clear: 'vt-field-button vt-treeselect-clear',
        dropdown: 'vt-treeselect-dropdown',
        overlay: 'vt-overlay vt-treeselect-overlay',
        tree: 'vt-treeselect-tree'
    }
});
