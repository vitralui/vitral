import { defineStyle } from '../defineStyle';
import css from './signaturepad.css?raw';

export const signaturepadStyle = defineStyle({
    name: 'signaturepad',
    css,
    classes: {
        root: (s: { disabled?: boolean; readonly?: boolean; empty?: boolean }) => [
            'vt-signaturepad',
            { 'vt-signaturepad-disabled': s.disabled, 'vt-signaturepad-readonly': s.readonly, 'vt-signaturepad-empty': s.empty }
        ],
        canvas: 'vt-signaturepad-canvas',
        /** A stroke: a line of one width, or `filled` as the outline of ink that thins. */
        ink: (s: { filled?: boolean }) => ['vt-signaturepad-ink', { 'vt-signaturepad-ink-filled': s.filled }],
        line: 'vt-signaturepad-line',
        placeholder: 'vt-signaturepad-placeholder',
        controls: 'vt-signaturepad-controls'
    }
});
