import { defineStyle } from '../defineStyle';
import css from './colorpicker.css?raw';

export interface ColorPickerState {
    disabled?: boolean;
    inline?: boolean;
}

export const colorpickerStyle = defineStyle({
    name: 'colorpicker',
    css,
    classes: {
        root: (s: ColorPickerState) => ['vt-colorpicker', { 'vt-colorpicker-disabled': s.disabled, 'vt-colorpicker-inline': s.inline }],
        swatch: 'vt-colorpicker-swatch',
        panel: (s: ColorPickerState) => ['vt-colorpicker-panel', { 'vt-overlay vt-colorpicker-overlay': !s.inline }],
        area: 'vt-colorpicker-area',
        hue: 'vt-colorpicker-hue',
        handle: 'vt-colorpicker-handle',
        footer: 'vt-colorpicker-footer',
        preview: 'vt-colorpicker-preview',
        field: 'vt-field vt-field-sm vt-colorpicker-field',
        input: 'vt-field-input vt-colorpicker-input'
    }
});
