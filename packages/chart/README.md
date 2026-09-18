# @vitral/chart

SVG charts with no framework in them: the engine and a DOM renderer, which the
Vitral components wrap.

Options are shaped the way ApexCharts made familiar, and everything visual is
plain data, so an options object survives `JSON.stringify` and a visual editor
can walk `chartOptionsSchema` to build a form for it.

```ts
import { createChart } from '@vitral/chart';

const chart = createChart(element, {
    type: 'area',
    series: [{ name: 'Visits', data: [12, 41, 35, 51] }],
    options: { chart: { height: 240 } }
});

chart.update({ series });
chart.destroy();
```

Line, area, bar, lollipop, scatter, bubble, heat map, candlestick, pie, donut,
radar and sparklines, with nice scales, datetime axes, a shared tooltip, legend
toggles, zoom and pan, a toolbar with SVG/PNG/CSV export, brush, synced groups,
annotations, keyboard walking with a live readout and an optional data table.

`@vitral/chart/engine` is the maths and the scene building on their own;
`@vitral/chart/style` is the class map and CSS.

**[Documentation](https://vitralui.github.io/vitral/#/components/chart)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
