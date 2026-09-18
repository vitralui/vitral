import { defineStyle } from '../defineStyle';
import css from './grid.css?raw';

export interface LayoutGridState {
    showGridLines?: boolean;
}

export const gridStyle = defineStyle({
    name: 'grid',
    css,
    classes: {
        root: (s: LayoutGridState) => ['vt-grid', { 'vt-grid-show-lines': s.showGridLines }],
        /** One cell outline drawn by `showGridLines`. */
        line: 'vt-grid-line'
    }
});

/** GridItem's classes. Its rules, if any, ship in the grid's stylesheet, which a Grid around it has loaded. */
export const griditemStyle = defineStyle({
    name: 'griditem',
    css: '',
    classes: {
        root: 'vt-griditem'
    }
});
