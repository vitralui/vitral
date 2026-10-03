# @vitral/editor

A rich text editor with no framework in it: the toolbar, the panels and the
content area over `@vitral/core`'s editor engine, which the Vitral components
wrap.

```ts
import { createTextEditor } from '@vitral/editor';

const editor = createTextEditor(element, {
    content: '<p>Hello</p>',
    placeholder: 'Write something…',
    showCount: true,
    on: { change: ({ html }) => save(html) }
});

editor.getMarkdown();
editor.destroy();
```

The document, the commands, the undo history, the input rules and the bridge to
the `contenteditable` element are the core's; this package is the interface
around them: the toolbar and its buttons, the block type, the colour swatches,
the link, image and table panels, the floating toolbar over a selection, the
menu a `/` opens in an empty block, and the handle beside a block.

Formulas are written in LaTeX and drawn: the toolbar's formula button and the
slash menu open a panel with the source, the formula drawn as it is typed and
the usual ones ready-made; a number or a letter of a formula pressed in the
text is edited where it stands. The drawing is outlines laid out here, not
text set by the browser, so it is the same everywhere and prints as it looks.
`math: false` switches the editing off, `math: { templates, inlineEdit }`
shapes it, and `createMathTools` attaches the same to an editor of your own.

A slash menu entry is `{ id, label, description, icon, command }` or carries a
`run` of its own, so an application can offer whatever it likes; the same goes
for the block handle's actions. What a framework component draws better — a
select, a colour picker — it hands over instead.

The text area (when a height makes it scroll), the slash menu and the formula list wear the theme's drawn scrollbars, the ScrollPanel's, over native
scrolling: `scrollbar: 'hover'` (the default) shows them under the pointer and
while scrolling, `'always'` keeps them on the screen, `'native'` gives the
browser's own back.

**[Documentation](https://vitralui.github.io/vitral/#/components/editor)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
