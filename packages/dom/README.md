# @vitral/dom

The DOM layer Vitral's framework-free packages render with. No framework, no
components of its own: a small keyed patcher (`h`, `createRoot`), the classes
of one part in one state with pass-through over them (`partResolver`,
`mergeAttrs`), and a pointer drag that works the same for a mouse, a pen and a
finger (`pointerDrag`).

The addons are built on it — `@vitral/chart`, `@vitral/datagrid`,
`@vitral/schedule`, `@vitral/taskboard`, `@vitral/editor` and
`@vitral/spreadsheet`, and `@vitral/controls`, the select, menu and anchored
panel they share — and the Vue, React and Angular components wrap those.

`scrollbars(element, { visibility, part })` draws the theme's scrollbars over
a box that already scrolls, without moving it or anything in it: native
scrolling stays, only the native bars are hidden, and the bars follow the box,
what grows inside it and the page around it; `arrows: true` adds arrows at
the ends that scroll a step a press and keep going while held. `scrollbarSet` and
`scrollbarSlot` keep them on the boxes of a renderer that redraws.

Licensed LGPL-3.0-or-later.
