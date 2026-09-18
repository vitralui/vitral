import { defineStyle } from '../defineStyle';
import css from './iftalabel.css?raw';

export interface IftaLabelState {
    invalid?: boolean;
}

export const iftalabelStyle = defineStyle({
    name: 'iftalabel',
    css,
    classes: {
        root: (s: IftaLabelState) => ['vt-iftalabel', { 'vt-iftalabel-invalid': s.invalid }]
    }
});
