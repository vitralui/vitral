import TaskboardVue from './Taskboard.vue';
import { TaskboardAddCard, TaskboardCard, TaskboardColumnFooter, TaskboardColumnHeader, TaskboardEmpty, TaskboardLaneHeader } from './parts';

/**
 * The board, and as properties the parts a template composes it from:
 * `<Taskboard.Card>`, `<Taskboard.ColumnHeader>`… `Root` is the board itself.
 * Each part is also a named export (`TaskboardCard`, `TaskboardAddCard`…).
 */
export const Taskboard = /* @__PURE__ */ Object.assign(TaskboardVue, {
    Root: TaskboardVue,
    Card: TaskboardCard,
    ColumnHeader: TaskboardColumnHeader,
    ColumnFooter: TaskboardColumnFooter,
    LaneHeader: TaskboardLaneHeader,
    AddCard: TaskboardAddCard,
    Empty: TaskboardEmpty
});

export { TaskboardCard, TaskboardColumnHeader, TaskboardColumnFooter, TaskboardLaneHeader, TaskboardAddCard, TaskboardEmpty };
export type * from './types';
