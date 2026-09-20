import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './daterange.css?raw';

export interface DateRangeDayState {
    /** One of the two ends. */
    end?: 'start' | 'end' | null;
    inRange?: boolean;
    today?: boolean;
    otherMonth?: boolean;
    /** A cell kept only so the six-week grid keeps its shape. */
    blank?: boolean;
    disabled?: boolean;
    /** Part of the range being previewed rather than the one chosen. */
    preview?: boolean;
}

export const daterangeStyle = defineStyle({
    name: 'daterange',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-daterange'],
        input: 'vt-field-input vt-daterange-input',
        dropdown: 'vt-field-button vt-daterange-dropdown',
        panel: (s: { inline?: boolean; disabled?: boolean }) => ['vt-overlay vt-daterange-panel', { 'vt-daterange-inline': s.inline, 'vt-daterange-disabled': s.disabled }],
        months: 'vt-daterange-months',
        month: 'vt-daterange-month',
        header: 'vt-daterange-header',
        title: 'vt-daterange-title',
        prevButton: 'vt-daterange-prev',
        nextButton: 'vt-daterange-next',
        grid: 'vt-daterange-grid',
        weekdays: 'vt-daterange-weekdays',
        weekday: 'vt-daterange-weekday',
        week: 'vt-daterange-week',
        day: (s: DateRangeDayState) => [
            'vt-daterange-day',
            {
                'vt-daterange-day-start': s.end === 'start',
                'vt-daterange-day-end': s.end === 'end',
                'vt-daterange-day-in-range': s.inRange,
                'vt-daterange-day-preview': s.preview,
                'vt-daterange-day-today': s.today,
                'vt-daterange-day-other-month': s.otherMonth,
                'vt-daterange-day-blank': s.blank,
                'vt-daterange-day-disabled': s.disabled
            }
        ],
        dayLabel: 'vt-daterange-day-label',
        footer: 'vt-daterange-footer'
    }
});
