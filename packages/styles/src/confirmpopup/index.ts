import { defineStyle } from '../defineStyle';
import css from './confirmpopup.css?raw';

export const confirmpopupStyle = defineStyle({
    name: 'confirmpopup',
    css,
    classes: {
        root: 'vt-overlay vt-confirmpopup',
        content: 'vt-confirmpopup-content',
        icon: (s: { severity?: string }) => ['vt-confirmpopup-icon', s.severity && `vt-confirmpopup-icon-${s.severity}`],
        message: 'vt-confirmpopup-message',
        header: 'vt-confirmpopup-header',
        footer: 'vt-confirmpopup-footer'
    }
});
