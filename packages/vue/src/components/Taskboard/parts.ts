import { definePart } from '../../base/parts';

/**
 * The board's content, written as children rather than as named slots:
 * `<Taskboard.Card>`, `<Taskboard.ColumnHeader>`, `<Taskboard.AddCard>`…
 * Each draws nothing itself — the board takes what is inside it and places it
 * where that part belongs, with the same slot props.
 */
export const TaskboardCard = definePart('Card', 'VtTaskboardCard');
export const TaskboardColumnHeader = definePart('ColumnHeader', 'VtTaskboardColumnHeader');
export const TaskboardColumnFooter = definePart('ColumnFooter', 'VtTaskboardColumnFooter');
export const TaskboardLaneHeader = definePart('LaneHeader', 'VtTaskboardLaneHeader');
export const TaskboardAddCard = definePart('AddCard', 'VtTaskboardAddCard');
export const TaskboardEmpty = definePart('Empty', 'VtTaskboardEmpty');
