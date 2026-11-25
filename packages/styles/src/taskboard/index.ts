import { defineStyle } from '../defineStyle';
import css from './taskboard.css?raw';

export type TaskboardWip = 'under' | 'at' | 'over';

export interface TaskboardColumnState {
    wip?: TaskboardWip;
    collapsed?: boolean;
    locked?: boolean;
    /** The column itself is being moved. */
    dragging?: boolean;
    /** A card is over this column and may drop here. */
    drop?: boolean;
    /** A card is over this column and may not drop here. */
    refused?: boolean;
}

export interface TaskboardCardState {
    /** Being moved: the card stays in the flow as the placeholder. */
    dragging?: boolean;
    /** Picked up with the keyboard. */
    grabbed?: boolean;
    disabled?: boolean;
    locked?: boolean;
    draggable?: boolean;
}

const column = (prefix: string, s: TaskboardColumnState) => [
    prefix,
    {
        [`vt-taskboard-wip-${s.wip}`]: s.wip && s.wip !== 'under',
        'vt-taskboard-collapsed': s.collapsed,
        'vt-taskboard-locked': s.locked,
        'vt-taskboard-column-dragging': s.dragging,
        'vt-taskboard-drop': s.drop,
        'vt-taskboard-refused': s.refused
    }
];

export const taskboardStyle = defineStyle({
    name: 'taskboard',
    css,
    classes: {
        root: (s: { disabled?: boolean; dragging?: boolean; emptyAt?: 'start' | 'center' | 'end'; collapsedTitleAt?: 'start' | 'center' | 'end' }) => [
            'vt-taskboard',
            {
                'vt-taskboard-disabled': s.disabled,
                'vt-taskboard-dragging': s.dragging,
                [`vt-taskboard-empty-at-${s.emptyAt}`]: !!s.emptyAt && s.emptyAt !== 'start',
                [`vt-taskboard-collapsed-title-at-${s.collapsedTitleAt}`]: !!s.collapsedTitleAt && s.collapsedTitleAt !== 'start'
            }
        ],
        grid: 'vt-taskboard-grid',
        header: (s: TaskboardColumnState) => column('vt-taskboard-header', s),
        accent: 'vt-taskboard-accent',
        title: 'vt-taskboard-title',
        /** A header of the host's own, where the title would be. */
        heading: 'vt-taskboard-heading',
        /** The column's subtitle, a line of its own under the title. */
        subtitle: 'vt-taskboard-subtitle',
        summary: 'vt-taskboard-summary',
        count: (s: { wip?: TaskboardWip }) => ['vt-taskboard-count', s.wip && s.wip !== 'under' && `vt-taskboard-count-${s.wip}`],
        handle: (s: { grabbed?: boolean }) => ['vt-taskboard-handle', { 'vt-taskboard-handle-grabbed': s.grabbed }],
        toggle: 'vt-taskboard-toggle',
        laneHeader: (s: { collapsed?: boolean }) => ['vt-taskboard-lane', { 'vt-taskboard-lane-collapsed': s.collapsed }],
        laneTitle: 'vt-taskboard-lane-title',
        laneCount: 'vt-taskboard-lane-count',
        cell: (s: TaskboardColumnState & { last?: boolean; empty?: boolean }) => [column('vt-taskboard-cell', s), { 'vt-taskboard-cell-last': s.last, 'vt-taskboard-cell-empty': s.empty }],
        list: 'vt-taskboard-list',
        card: (s: TaskboardCardState) => [
            'vt-taskboard-card',
            {
                'vt-taskboard-card-dragging': s.dragging,
                'vt-taskboard-card-grabbed': s.grabbed,
                'vt-taskboard-card-disabled': s.disabled,
                'vt-taskboard-card-locked': s.locked,
                'vt-taskboard-card-draggable': s.draggable
            }
        ],
        cardTitle: 'vt-taskboard-card-title',
        strip: 'vt-taskboard-strip',
        lockIcon: 'vt-taskboard-lock',
        empty: 'vt-taskboard-empty',
        addCard: 'vt-taskboard-add',
        footer: (s: TaskboardColumnState) => column('vt-taskboard-footer', s),
        preview: 'vt-taskboard-preview',
        /** Where a dragged card would land, opened among the cards while it is dragged. */
        cardSlot: 'vt-taskboard-card-slot',
        /** Where a dragged column would go: a piece in the head, in each row of cells and in the foot. */
        columnSlot: (s: { edge?: 'header' | 'cell' | 'footer' }) => ['vt-taskboard-column-slot', `vt-taskboard-column-slot-${s.edge}`],
        status: 'vt-sr-only',
        instructions: 'vt-sr-only'
    }
});
