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

A slash menu entry is `{ id, label, description, icon, command }` or carries a
`run` of its own, so an application can offer whatever it likes; the same goes
for the block handle's actions. What a framework component draws better — a
select, a colour picker — it hands over instead.

**[Documentation](https://vitralui.github.io/vitral/#/components/editor)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
