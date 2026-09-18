import { defineStyle } from '../defineStyle';
import { reorderListClasses } from '../orderlist';
import css from './picklist.css?raw';

export const picklistStyle = defineStyle({
    name: 'picklist',
    css,
    classes: {
        root: 'vt-picklist',
        transfer: 'vt-picklist-transfer',
        ...reorderListClasses('vt-picklist')
    }
});
