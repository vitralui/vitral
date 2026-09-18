import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputtag.css?raw';

export interface InputTagState extends FieldState {
    /** The list is at its maximum. */
    full?: boolean;
}

export interface InputTagTagState {
    /** The keyboard is on this tag. */
    focused?: boolean;
}

export const inputtagStyle = defineStyle({
    name: 'inputtag',
    css,
    classes: {
        root: (s: InputTagState) => [fieldClasses(s), 'vt-inputtag', { 'vt-inputtag-full': s.full }],
        list: 'vt-inputtag-list',
        tag: (s: InputTagTagState) => ['vt-inputtag-tag', { 'vt-inputtag-tag-focused': s.focused }],
        tagLabel: 'vt-inputtag-tag-label',
        remove: 'vt-inputtag-remove',
        input: 'vt-field-input vt-inputtag-input'
    }
});
