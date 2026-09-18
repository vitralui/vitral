import { defineStyle } from '../defineStyle';
import css from './dynamicdialog.css?raw';

/** The parts a dynamic dialog adds; the dialog's own parts come from `dialogStyle`. */
export const dynamicdialogStyle = defineStyle({
    name: 'dynamicdialog',
    css,
    classes: {
        header: 'vt-dynamicdialog-header',
        footer: 'vt-dynamicdialog-footer'
    }
});
