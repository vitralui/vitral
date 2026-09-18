import { defineStyle } from '../defineStyle';
import css from './confirmdialog.css?raw';

export interface ConfirmDialogIconState {
    severity?: string;
}

/** The parts the confirm dialog adds; the dialog's own parts come from `dialogStyle`. */
export const confirmdialogStyle = defineStyle({
    name: 'confirmdialog',
    css,
    classes: {
        body: 'vt-confirmdialog-body',
        icon: (s: ConfirmDialogIconState) => ['vt-confirmdialog-icon', s.severity && `vt-confirmdialog-icon-${s.severity}`],
        message: 'vt-confirmdialog-message'
    }
});
