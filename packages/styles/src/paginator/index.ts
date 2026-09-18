import { defineStyle } from '../defineStyle';
import css from './paginator.css?raw';

export interface PaginatorPageState {
    selected?: boolean;
}

export const paginatorStyle = defineStyle({
    name: 'paginator',
    css,
    classes: {
        root: 'vt-paginator',
        start: 'vt-paginator-start',
        end: 'vt-paginator-end',
        first: 'vt-paginator-button vt-paginator-first',
        prev: 'vt-paginator-button vt-paginator-prev',
        next: 'vt-paginator-button vt-paginator-next',
        last: 'vt-paginator-button vt-paginator-last',
        pages: 'vt-paginator-pages',
        page: (s: PaginatorPageState) => ['vt-paginator-button', 'vt-paginator-page', { 'vt-paginator-page-selected': s.selected }],
        current: 'vt-paginator-current',
        rowsPerPage: 'vt-paginator-rows-per-page'
    }
});
