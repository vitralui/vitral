import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './datepicker.css?raw';

export interface DatePickerPanelState {
    inline?: boolean;
    disabled?: boolean;
}

export interface DatePickerDayState {
    selected?: boolean;
    today?: boolean;
    otherMonth?: boolean;
    disabled?: boolean;
}

export const datepickerStyle = defineStyle({
    name: 'datepicker',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-datepicker'],
        input: 'vt-field-input vt-datepicker-input',
        dropdown: 'vt-field-button vt-datepicker-dropdown',
        panel: (s: DatePickerPanelState) => ['vt-overlay vt-datepicker-panel', { 'vt-datepicker-inline': s.inline, 'vt-datepicker-disabled': s.disabled }],
        header: 'vt-datepicker-header',
        title: 'vt-datepicker-title',
        prevButton: 'vt-datepicker-prev',
        nextButton: 'vt-datepicker-next',
        grid: 'vt-datepicker-grid',
        weekdays: 'vt-datepicker-weekdays',
        weekday: 'vt-datepicker-weekday',
        week: 'vt-datepicker-week',
        day: (s: DatePickerDayState) => [
            'vt-datepicker-day',
            {
                'vt-datepicker-day-selected': s.selected,
                'vt-datepicker-day-today': s.today,
                'vt-datepicker-day-other-month': s.otherMonth,
                'vt-datepicker-day-disabled': s.disabled
            }
        ],
        dayLabel: 'vt-datepicker-day-label',
        footer: 'vt-datepicker-footer',
        todayButton: 'vt-datepicker-today-button',
        clearButton: 'vt-datepicker-clear-button'
    }
});
