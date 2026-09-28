import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './textarea.css?raw';

export interface TextareaState extends FieldState {
    autoResize?: boolean;
    /** The grip is being dragged. */
    resizing?: boolean;
}

export const textareaStyle = defineStyle({
    name: 'textarea',
    css,
    classes: {
        root: (s: TextareaState) => [fieldClasses(s), 'vt-textarea', { 'vt-textarea-auto-resize': s.autoResize, 'vt-textarea-resizing': s.resizing }],
        input: 'vt-field-input vt-textarea-input',
        resizer: (s: { direction?: string }) => ['vt-textarea-resizer', s.direction && `vt-textarea-resizer-${s.direction}`]
    }
});
