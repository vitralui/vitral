# @vitral/taskboard

A task board with no framework in it: the engine and a DOM renderer, which the
Vitral components wrap.

Each column (or column × lane cell) is a list named by its column and its card
count. Cards are focusable items with a roving tab stop, and the arrow keys
move between them. Moving follows the accessible drag-and-drop pattern: Space
picks a card up, the arrows carry it, Space drops and Escape puts it back, and
every step is announced.

```ts
import { createTaskboard } from '@vitral/taskboard';

const board = createTaskboard(element, {
    columns: [
        { key: 'todo', title: 'To do' },
        { key: 'doing', title: 'Doing', wipLimit: 2 },
        { key: 'done', title: 'Done' }
    ],
    items: tasks,
    on: {
        'card-move': ({ item, to, value }) => save(item, to, value),
        'drop-refused': ({ reason }) => console.log(reason)
    }
});

board.update({ items });
board.destroy();
```

A board is either columns that carry their own cards or one flat list whose
cards name their column in a field; everything else is the same either way.
Swimlanes, work-in-progress limits, locked columns and cards, a `canDrop` that
has the last word, columns the reader reorders, and columns and lanes that
collapse.

A pointer — mouse, pen, or a finger that rests a moment — drags the same way,
with the board scrolling at its edges, and the board is shown with the move
applied while it is in progress, so what is seen is what a drop will commit.

`@vitral/taskboard/engine` is the arithmetic on its own: which lanes there are,
which card sits where, what each cell is called and whether a move into it is
allowed. No DOM, no timers.

**[Documentation](https://vitralui.github.io/vitral/#/components/taskboard)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
