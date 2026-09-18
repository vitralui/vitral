import { defineStyle } from '../defineStyle';
import css from './uniformgrid.css?raw';

export const uniformgridStyle = defineStyle({
    name: 'uniformgrid',
    css,
    classes: {
        root: 'vt-uniformgrid',
        /** The empty cells `firstColumn` leaves before the first child. */
        spacer: 'vt-uniformgrid-spacer'
    }
});
