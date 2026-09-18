import { defineStyle } from '../defineStyle';
import css from './splitter.css?raw';

export interface SplitterState {
    layout?: 'horizontal' | 'vertical';
    /** A gutter is being dragged. */
    resizing?: boolean;
}

export interface SplitterGutterState {
    /** This gutter is the one being dragged or moved by the keyboard. */
    active?: boolean;
}

export const splitterStyle = defineStyle({
    name: 'splitter',
    css,
    classes: {
        root: (s: SplitterState) => ['vt-splitter', `vt-splitter-${s.layout ?? 'horizontal'}`, { 'vt-splitter-resizing': s.resizing }],
        gutter: (s: SplitterGutterState) => ['vt-splitter-gutter', { 'vt-splitter-gutter-active': s.active }],
        gutterHandle: 'vt-splitter-gutter-handle'
    }
});

/** SplitterPanel's classes. Its rules ship in the splitter's stylesheet, which the Splitter around it has loaded. */
export const splitterpanelStyle = defineStyle({
    name: 'splitterpanel',
    css: '',
    classes: {
        root: 'vt-splitterpanel'
    }
});
