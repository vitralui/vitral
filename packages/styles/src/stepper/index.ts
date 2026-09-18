import { defineStyle } from '../defineStyle';
import css from './stepper.css?raw';

export interface StepState {
    active?: boolean;
    done?: boolean;
    disabled?: boolean;
}

export const stepperStyle = defineStyle({
    name: 'stepper',
    css,
    classes: {
        root: 'vt-stepper',
        list: 'vt-stepper-list',
        step: (s: StepState) => ['vt-stepper-step', { 'vt-stepper-step-active': s.active, 'vt-stepper-step-done': s.done, 'vt-stepper-step-disabled': s.disabled }],
        header: 'vt-stepper-header',
        number: 'vt-stepper-number',
        title: 'vt-stepper-title',
        separator: 'vt-stepper-separator',
        panels: 'vt-stepper-panels',
        panel: 'vt-stepper-panel',
        item: 'vt-stepper-item'
    }
});
