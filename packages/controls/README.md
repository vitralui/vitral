# @vitral/controls

The controls an addon needs, with no framework in them.

An addon draws its own markup, but a select, a menu and an anchored panel are
not markup — they are behaviour, and each was being written again in every
addon that needed one. These are written once, over `@vitral/core`'s arithmetic
and `@vitral/dom`'s patcher, and they wear the same styles the framework
components wear: a page with no framework gets the control the framework would
have drawn.

```ts
import { createSelect, createMenu, createOverlay } from '@vitral/controls';

const select = createSelect(element, {
    options: [
        { label: 'Lisbon', value: 'lis' },
        { label: 'Porto', value: 'opo' }
    ],
    optionValue: 'value',
    ariaLabel: 'City',
    onChange: (value) => console.log(value)
});
```

`createOverlay` is a panel that hangs from something: put in the nearest
overlay host, kept against its anchor while anything moves, closed on Escape —
which puts the keyboard back where it was — or on a press outside it, and
stacked so only the topmost one hears either.

`createSelect` is a listbox select: the button is the combobox, it keeps the
keyboard while the list is open and points at the option in hand through
`aria-activedescendant`. Arrows, Home, End, typeahead and Enter, as a native
select behaves.

`createMenu` is a menu of commands following the APG menu button pattern: the
menu takes the keyboard, the arrows walk it around the ends, Enter chooses and
Escape puts the keyboard back on the button.

A framework component that already has a better control hands it to the addon
instead — that is what an addon's `content` hooks are for.

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
