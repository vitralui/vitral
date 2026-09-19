# @vitral/spreadsheet

A spreadsheet with no framework in it: cells, A1 references, formulas over
them, and the graph that says what has to be worked out again when one
changes. Part of [Vitral](https://vitralui.github.io/vitral/).

```ts
import { createSheet } from '@vitral/spreadsheet/engine';

const sheet = createSheet({
    cells: { A1: 'Desk', B1: 320, C1: 2, D1: '=B1*C1', D2: '=SUM(D1:D1)' }
});

sheet.value({ row: 0, col: 3 }); // 640
sheet.setInput({ row: 0, col: 2 }, '5');
sheet.value({ row: 0, col: 3 }); // 1600
```

A sheet is a map of addresses to what was typed into them, and everything else
is worked out from it — so it survives `JSON`, comes back the same, and can be
tested without a document in sight.

- **Formulas**: the usual operators with the usual strengths, rectangles
  (`A1:C9`), `$` to pin a reference, and sixty-three functions — `SUM`,
  `AVERAGE`, `IF`, `COUNTIF`, `VLOOKUP`, `INDEX`, `MATCH`, the text ones, and
  dates counted the way every spreadsheet counts them.
- **Only what changed**: an edit works out the cells that followed from it,
  not the sheet.
- **Errors are values**: `#DIV/0!`, `#NAME?`, `#CIRCULAR!` and the rest travel
  through arithmetic the way they should, and a formula that does not read is
  kept as it was typed rather than refused.
- **Editing**: fill with the references carried, a run of numbers carried on,
  tab-separated paste and copy, formats, and undo.

Licensed LGPL-3.0-or-later.
