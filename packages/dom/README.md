# @vitral/dom

The DOM layer Vitral's framework-free packages render with. No framework, no
components of its own: a small keyed patcher (`h`, `createRoot`), the classes
of one part in one state with pass-through over them (`partResolver`,
`mergeAttrs`), and a pointer drag that works the same for a mouse, a pen and a
finger (`pointerDrag`).

`@vitral/chart` and `@vitral/datatable` are built on it, and the Vue, React and
Angular components wrap those.

Licensed LGPL-3.0-or-later.
