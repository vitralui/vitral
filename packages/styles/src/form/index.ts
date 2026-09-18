import { defineStyle } from '../defineStyle';
import css from './form.css?raw';

export interface FormFieldState {
    invalid?: boolean;
    /** Several controls (radios, checkboxes) answer the one question. */
    group?: boolean;
    disabled?: boolean;
}

export const formStyle = defineStyle({
    name: 'form',
    css,
    classes: {
        root: 'vt-form',
        field: (s: FormFieldState) => ['vt-form-field', { 'vt-form-field-invalid': s.invalid, 'vt-form-field-group': s.group, 'vt-form-field-disabled': s.disabled }],
        label: 'vt-form-label',
        description: 'vt-form-description',
        message: 'vt-form-message',
        messageIcon: 'vt-form-message-icon',
        summary: 'vt-form-summary',
        summaryBody: 'vt-form-summary-body',
        summaryTitle: 'vt-form-summary-title',
        summaryList: 'vt-form-summary-list',
        summaryItem: 'vt-form-summary-item',
        summaryLink: 'vt-form-summary-link',
        fieldArray: 'vt-form-fieldarray',
        submit: 'vt-form-submit',
        reset: 'vt-form-reset'
    }
});
