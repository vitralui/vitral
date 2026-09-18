import { optionClasses, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './orderlist.css?raw';

export interface ReorderOptionState extends OptionState {
    drop?: 'before' | 'after' | null;
}

/** The parts of the reorderable list OrderList and PickList share, under one component's class prefix. */
export function reorderListClasses(prefix: string) {
    return {
        panel: (s: { disabled?: boolean }) => [`${prefix}-panel`, { [`${prefix}-disabled`]: s.disabled }],
        header: `${prefix}-header`,
        list: `vt-option-list ${prefix}-list`,
        option: (s: ReorderOptionState) => [optionClasses(s), `${prefix}-option`, s.drop && `${prefix}-option-drop-${s.drop}`],
        controls: `${prefix}-controls`,
        status: 'vt-sr-only',
        instructions: 'vt-sr-only'
    };
}

export const orderlistStyle = defineStyle({
    name: 'orderlist',
    css,
    classes: {
        root: 'vt-orderlist',
        ...reorderListClasses('vt-orderlist')
    }
});
