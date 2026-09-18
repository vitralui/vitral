import { defineStyle } from '../defineStyle';
import css from './dock.css?raw';

export interface DockItemState {
    /** How far the item is from the one under the pointer: 0 is that one. */
    distance?: number;
    disabled?: boolean;
}

export const dockStyle = defineStyle({
    name: 'dock',
    css,
    classes: {
        root: (s: { position?: string; magnify?: boolean }) => ['vt-dock', s.position && `vt-dock-${s.position}`, { 'vt-dock-magnify': s.magnify }],
        list: 'vt-dock-list',
        item: (s: DockItemState) => [
            'vt-dock-item',
            { 'vt-dock-item-active': s.distance === 0, 'vt-dock-item-near': s.distance === 1, 'vt-dock-item-far': s.distance === 2, 'vt-dock-item-disabled': s.disabled }
        ],
        action: 'vt-dock-action'
    }
});
