import type { ChartKind, ChartOptions, ChartSeries } from '@vitral/vue';
import { lookup } from './i18n';

/**
 * The chart gallery: every kind the engine draws, with the data and options it
 * is drawn from. Kept as data rather than as a page of markup, because the page
 * shows each entry three ways — the picture, the line that renders it, and the
 * options behind it — and all three have to say the same thing.
 */
export interface ChartEntry {
    id: string;
    name: string;
    family: Family;
    kind: ChartKind;
    /** What this chart is for, and when to reach for it instead of its neighbour. */
    note: string;
    series: ChartSeries;
    options: ChartOptions;
}

export type Family = 'Over time' | 'Compared' | 'Spread' | 'Parts of a whole';
export const families: Family[] = ['Over time', 'Compared', 'Spread', 'Parts of a whole'];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * Response times to bin. Written out rather than generated, so the gallery
 * draws the same histogram on every visit and in every screenshot.
 */
const latencies = [
    38, 41, 44, 45, 47, 48, 49, 51, 52, 52, 53, 54, 55, 55, 56, 57, 58, 58, 59, 60, 61, 61, 62, 63, 64, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 76, 78, 80, 82, 84, 86,
    88, 91, 94, 98, 103, 109, 118, 134
];

/**
 * A year of daily activity, written out from a fixed seed: busier on weekdays,
 * quiet at the weekend, with a fortnight off in August.
 */
const calendarYear = (() => {
    let seed = 20260101;
    const next = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < 365; i++) {
        const date = new Date(2026, 0, 1 + i);
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        const away = date.getMonth() === 7 && date.getDate() > 8 && date.getDate() < 24;
        const value = away ? 0 : Math.round(next() * (weekend ? 4 : 14) * (next() > 0.15 ? 1 : 0));
        if (value > 0) out.push({ x: date.getTime(), y: value });
    }
    return out;
})();

/** Every gallery chart is small, so none of them carries a toolbar or a title. */
const compact: ChartOptions = { chart: { toolbar: { show: false } }, legend: { position: 'bottom' } };

export const chartEntries: ChartEntry[] = [
    {
        id: 'line',
        name: 'Line',
        family: 'Over time',
        kind: 'line',
        note: 'One value as it moves. The chart to reach for first, and the one a reader never has to be taught.',
        series: [{ name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] }],
        options: { ...compact, xaxis: { categories: months }, stroke: { curve: 'smooth', width: 3 }, legend: { show: false } }
    },
    {
        id: 'line-multi',
        name: 'Line, several series',
        family: 'Over time',
        kind: 'line',
        note: 'Two or three lines compare shapes. Past four, the plot becomes a knot and a small multiple reads better.',
        series: [
            { name: 'API', data: [120, 150, 140, 180, 210, 190, 240, 260, 250, 290, 310, 330] },
            { name: 'Web', data: [80, 90, 110, 100, 130, 150, 140, 160, 180, 170, 200, 220] },
            { name: 'Jobs', data: [30, 28, 35, 40, 38, 42, 46, 50, 48, 53, 56, 60] }
        ],
        options: { ...compact, xaxis: { categories: months }, stroke: { curve: 'smooth', width: 2 }, markers: { size: 0 } }
    },
    {
        id: 'area',
        name: 'Area, stacked',
        family: 'Over time',
        kind: 'area',
        note: 'A total over time, and what it is made of. Stacked, the top edge is the total; unstacked, the fills overlap and mislead.',
        series: [
            { name: 'API', data: [120, 150, 140, 180, 210, 190, 240, 260, 250, 290, 310, 330] },
            { name: 'Web', data: [80, 90, 110, 100, 130, 150, 140, 160, 180, 170, 200, 220] },
            { name: 'Jobs', data: [30, 28, 35, 40, 38, 42, 46, 50, 48, 53, 56, 60] }
        ],
        options: { ...compact, chart: { stacked: true, toolbar: { show: false } }, xaxis: { categories: months }, stroke: { curve: 'monotoneCubic', width: 2 } }
    },
    {
        id: 'range-area',
        name: 'Range area',
        family: 'Over time',
        kind: 'rangeArea',
        note: 'The band between a low and a high, month by month: a forecast\u2019s spread, or the day\u2019s range. One fill, two edges.',
        series: [{ name: 'Forecast', data: months.map((m, i) => ({ x: m, y: [40 + i * 4, 70 + i * 6] as [number, number] })) }],
        options: { ...compact, stroke: { curve: 'smooth', width: 2 }, legend: { show: false } }
    },
    {
        id: 'stream',
        name: 'Stream',
        family: 'Over time',
        kind: 'stream',
        note: 'A stacked area floating on a baseline of its own. The bands share the movement instead of the bottom one carrying it, which is what makes the shape readable.',
        series: ['Search', 'Direct', 'Social', 'Mail', 'Referral'].map((name, row) => ({
            name,
            data: months.map((_, i) => Math.round(30 + Math.sin((i + row * 2) / 1.7) * 18 + row * 6 + i * (row % 2 ? 1.5 : 3)))
        })),
        options: { ...compact, xaxis: { categories: months } }
    },
    {
        id: 'combined',
        name: 'Bars and a line',
        family: 'Over time',
        kind: 'bar',
        note: 'Two marks on one plot: the amount as bars, the rate as a line, each on its own axis. Every series names the mark it wants.',
        series: [
            { name: 'Revenue', type: 'bar', data: [44, 55, 41, 67, 22, 43, 58, 63, 60, 66, 70, 81] },
            { name: 'Margin', type: 'line', data: [12, 14, 13, 18, 9, 12, 15, 17, 16, 18, 19, 22] }
        ],
        options: {
            ...compact,
            xaxis: { categories: months },
            yaxis: [{ title: { text: 'Revenue' } }, { opposite: true, title: { text: 'Margin' } }],
            stroke: { width: [0, 3], curve: 'smooth' }
        }
    },
    {
        id: 'candlestick',
        name: 'Candlestick',
        family: 'Over time',
        kind: 'candlestick',
        note: 'Four numbers a period: open, high, low and close. Each point is a tuple, in that order.',
        series: [
            {
                name: 'ACME',
                data: [
                    ['Mon', 51, 58, 50, 56],
                    ['Tue', 56, 60, 55, 55],
                    ['Wed', 55, 57, 51, 52],
                    ['Thu', 52, 59, 52, 58],
                    ['Fri', 58, 64, 57, 63],
                    ['Sat', 63, 65, 60, 61],
                    ['Sun', 61, 66, 60, 65]
                ]
            }
        ],
        options: { ...compact, legend: { show: false } }
    },
    {
        id: 'bar',
        name: 'Bar, grouped',
        family: 'Compared',
        kind: 'bar',
        note: 'Amounts side by side. The baseline has to be zero: a bar says how big, and a cut axis lies about it.',
        series: [
            { name: 'North', data: [44, 55, 41, 67] },
            { name: 'South', data: [13, 23, 20, 8] },
            { name: 'East', data: [11, 17, 15, 15] }
        ],
        options: { ...compact, xaxis: { categories: quarters } }
    },
    {
        id: 'bar-stacked',
        name: 'Bar, stacked',
        family: 'Compared',
        kind: 'bar',
        note: 'The total per category, split. Only the bottom band is easy to compare across categories — put the series that matters there.',
        series: [
            { name: 'North', data: [44, 55, 41, 67] },
            { name: 'South', data: [13, 23, 20, 8] },
            { name: 'East', data: [11, 17, 15, 15] }
        ],
        options: { ...compact, chart: { stacked: true, toolbar: { show: false } }, xaxis: { categories: quarters } }
    },
    {
        id: 'bar-full',
        name: 'Bar, to 100%',
        family: 'Compared',
        kind: 'bar',
        note: 'Shares rather than amounts: every bar is full, so the mix is comparable and the size is gone.',
        series: [
            { name: 'North', data: [44, 55, 41, 67] },
            { name: 'South', data: [13, 23, 20, 8] },
            { name: 'East', data: [11, 17, 15, 15] }
        ],
        options: { ...compact, chart: { stacked: true, stackType: '100%', toolbar: { show: false } }, xaxis: { categories: quarters } }
    },
    {
        id: 'bar-horizontal',
        name: 'Bar, horizontal',
        family: 'Compared',
        kind: 'bar',
        note: 'Long category names, or many of them: the labels get the room they need and stay level.',
        series: [{ name: 'Requests', data: [44, 55, 41, 67, 22, 43] }],
        options: {
            ...compact,
            plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
            xaxis: { categories: ['Authentication', 'Billing', 'Reporting', 'Search', 'Notifications', 'Exports'] },
            legend: { show: false }
        }
    },
    {
        id: 'lollipop',
        name: 'Lollipop',
        family: 'Compared',
        kind: 'lollipop',
        note: 'A bar with the ink taken out. The same comparison at a fraction of the weight, for a page with many of them.',
        series: [{ name: 'Requests', data: [44, 55, 41, 67, 22, 43] }],
        options: {
            ...compact,
            xaxis: { categories: ['Authentication', 'Billing', 'Reporting', 'Search', 'Notifications', 'Exports'], labels: { rotate: -35 } },
            legend: { show: false }
        }
    },
    {
        id: 'waterfall',
        name: 'Waterfall',
        family: 'Compared',
        kind: 'waterfall',
        note: 'How a number got from one total to another. Each bar starts where the last one stopped; a total bar returns to zero.',
        series: [{ name: 'Cash', data: [1200, 420, -180, 310, -260, null] }],
        options: {
            ...compact,
            xaxis: { categories: ['Opening', 'Sales', 'Refunds', 'Services', 'Costs', 'Closing'] },
            plotOptions: { waterfall: { totals: [5] } },
            legend: { show: false }
        }
    },
    {
        id: 'range-bar',
        name: 'Range bar',
        family: 'Compared',
        kind: 'rangeBar',
        note: 'A bar between two numbers instead of up from zero. Each point is `[low, high]`, so it reads as a span rather than an amount.',
        series: [{ name: 'Temperature', data: quarters.map((q, i) => ({ x: q, y: [8 + i * 3, 17 + i * 4] as [number, number] })) }],
        options: { ...compact, legend: { show: false }, yaxis: { title: { text: '\u00b0C' } } }
    },
    {
        id: 'bullet',
        name: 'Bullet',
        family: 'Compared',
        kind: 'bullet',
        note: 'One measure, its target and the bands it falls in: a gauge\u2019s job in a strip a table row can hold. The tick is the target, the bands are poor, fair and good.',
        series: [
            {
                name: 'Against target',
                data: [
                    { x: 'Revenue', y: 78, target: 90 },
                    { x: 'Signups', y: 112, target: 100 },
                    { x: 'Retention', y: 64, target: 75 },
                    { x: 'Margin', y: 41, target: 50 }
                ]
            }
        ],
        options: { ...compact, plotOptions: { bullet: { ranges: [{ from: 0, to: 130 }, { from: 0, to: 90 }, { from: 0, to: 55 }] } }, legend: { show: false } }
    },
    {
        id: 'scatter',
        name: 'Scatter',
        family: 'Spread',
        kind: 'scatter',
        note: 'Two measures against each other, one point a thing. What it is for is the shape of the cloud, not any one dot.',
        series: [
            { name: 'Trial', data: [[12, 40], [18, 52], [24, 47], [30, 68], [36, 71], [41, 65], [48, 83], [54, 78]] },
            { name: 'Paid', data: [[15, 22], [22, 31], [28, 26], [34, 44], [39, 39], [46, 51], [52, 48], [58, 62]] }
        ],
        options: { ...compact, xaxis: { type: 'numeric', title: { text: 'Sessions' } }, yaxis: { title: { text: 'Minutes' } } }
    },
    {
        id: 'bubble',
        name: 'Bubble',
        family: 'Spread',
        kind: 'bubble',
        note: 'A scatter with a third number as the area. Area, not radius: doubling the radius would draw four times the quantity.',
        series: [
            { name: 'Europe', data: [{ x: 12, y: 40, z: 18 }, { x: 24, y: 47, z: 34 }, { x: 36, y: 71, z: 12 }, { x: 48, y: 83, z: 44 }] },
            { name: 'Americas', data: [{ x: 15, y: 22, z: 26 }, { x: 28, y: 26, z: 14 }, { x: 39, y: 39, z: 38 }, { x: 52, y: 48, z: 22 }] }
        ],
        options: { ...compact, xaxis: { type: 'numeric' } }
    },
    {
        id: 'heatmap',
        name: 'Heat map',
        family: 'Spread',
        kind: 'heatmap',
        note: 'A grid where colour is the value: two categories in, one measure out. Good for a week by an hour.',
        series: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, row) => ({
            name: day,
            data: ['09', '11', '13', '15', '17', '19'].map((hour, col) => ({ x: hour, y: ((row * 7 + col * 5) % 9) * 11 + 8 }))
        })),
        options: { ...compact, legend: { show: false } }
    },
    {
        id: 'histogram',
        name: 'Histogram',
        family: 'Spread',
        kind: 'histogram',
        note: 'Raw readings in, counts out: the chart works out the bins itself. Pass a plain list of numbers, not categories.',
        series: [{ name: 'Response time', data: latencies }],
        options: { ...compact, legend: { show: false }, xaxis: { title: { text: 'Milliseconds' } }, yaxis: { title: { text: 'Requests' } } }
    },
    {
        id: 'box-plot',
        name: 'Box plot',
        family: 'Spread',
        kind: 'boxPlot',
        note: 'Five numbers a category \u2014 minimum, quartiles, median, maximum \u2014 so two distributions compare without either being averaged away.',
        series: [
            {
                name: 'Response time',
                data: [
                    { x: 'API', y: [12, 28, 41, 63, 140] as [number, number, number, number, number] },
                    { x: 'Web', y: [30, 52, 68, 90, 180] as [number, number, number, number, number] },
                    { x: 'Jobs', y: [8, 15, 22, 34, 70] as [number, number, number, number, number] }
                ]
            }
        ],
        options: { ...compact, legend: { show: false }, yaxis: { title: { text: 'Milliseconds' } } }
    },
    {
        id: 'treemap',
        name: 'Treemap',
        family: 'Parts of a whole',
        kind: 'treemap',
        note: 'Shares of a total as areas rather than as angles. It holds many more parts than a pie, and the boxes are laid squarely so none of them is a sliver.',
        series: [
            { name: 'Europe', data: [{ x: 'Germany', y: 84 }, { x: 'France', y: 68 }, { x: 'Spain', y: 47 }, { x: 'Portugal', y: 10 }] },
            { name: 'Americas', data: [{ x: 'United States', y: 132 }, { x: 'Brazil', y: 72 }, { x: 'Mexico', y: 39 }, { x: 'Chile', y: 12 }] },
            { name: 'Asia', data: [{ x: 'Japan', y: 61 }, { x: 'India', y: 55 }, { x: 'Singapore', y: 14 }] }
        ],
        options: { ...compact }
    },
    {
        id: 'calendar',
        name: 'Calendar',
        family: 'Over time',
        kind: 'calendar',
        note: 'A year of days as a grid of weeks. A line of 365 points shows the trend; this shows the day, which is what a record of daily activity is read for.',
        series: [{ name: 'Commits', data: calendarYear }],
        options: { ...compact, plotOptions: { calendar: { weekStart: 1 } }, colors: ['var(--vt-chart-3)'], legend: { show: false } }
    },
    {
        id: 'radial-bar',
        name: 'Radial bar',
        family: 'Parts of a whole',
        kind: 'radialBar',
        note: 'A ring a measure, as far round as its share of the maximum. Three or four at a time: they are read against their own tracks, not against each other.',
        series: [
            { name: 'Storage', data: [72] },
            { name: 'Memory', data: [48] },
            { name: 'CPU', data: [35] }
        ],
        options: { ...compact, legend: { position: 'bottom' } }
    },
    {
        id: 'gauge',
        name: 'Gauge',
        family: 'Parts of a whole',
        kind: 'gauge',
        note: 'One number against its maximum, with the reading in the middle. The arc leaves the bottom open, which is what tells it apart from a ring at a glance.',
        series: [{ name: 'Uptime', data: [96] }],
        options: { ...compact, colors: ['var(--vt-chart-3)'], dataLabels: { formatter: '{percent|percent:0}' } }
    },
    {
        id: 'sunburst',
        name: 'Sunburst',
        family: 'Parts of a whole',
        kind: 'sunburst',
        note: 'A pie of several rings, one a level of a tree. It answers what a pie cannot \u2014 what a slice is made of \u2014 without leaving the circle.',
        series: [
            { name: 'Europe', data: [{ x: 'Germany', y: 84 }, { x: 'France', y: 68 }, { x: 'Spain', y: 47 }] },
            { name: 'Americas', data: [{ x: 'United States', y: 132 }, { x: 'Brazil', y: 72 }, { x: 'Mexico', y: 39 }] },
            { name: 'Asia', data: [{ x: 'Japan', y: 61 }, { x: 'India', y: 55 }] }
        ],
        options: { ...compact, legend: { show: false } }
    },
    {
        id: 'pie',
        name: 'Pie',
        family: 'Parts of a whole',
        kind: 'pie',
        note: 'Shares of one total, at a glance. Three or four slices; past that the angles stop being readable and a bar is kinder.',
        series: [44, 30, 18, 8],
        options: { ...compact, labels: ['Direct', 'Search', 'Social', 'Mail'] }
    },
    {
        id: 'donut',
        name: 'Donut',
        family: 'Parts of a whole',
        kind: 'donut',
        note: 'A pie with the middle free, which is where the total goes. The hole is what makes it worth using.',
        series: [44, 30, 18, 8],
        options: { ...compact, labels: ['Direct', 'Search', 'Social', 'Mail'] }
    },
    {
        id: 'radar',
        name: 'Radar',
        family: 'Parts of a whole',
        kind: 'radar',
        note: 'A profile across the same few measures, for comparing two or three subjects on shape rather than on level.',
        series: [
            { name: 'This release', data: [80, 65, 90, 70, 85, 60] },
            { name: 'Last release', data: [65, 70, 72, 60, 75, 55] }
        ],
        options: { ...compact, labels: ['Speed', 'Size', 'A11y', 'API', 'Docs', 'Tests'] }
    },
    {
        id: 'funnel',
        name: 'Funnel',
        family: 'Parts of a whole',
        kind: 'funnel',
        note: 'Stages of a process, each as wide as its share of the first. What it is read for is where the drop is, so the labels carry the percentages.',
        series: [{ name: 'Signups', data: [4820, 3100, 1740, 980, 610] }],
        options: {
            ...compact,
            labels: ['Visited', 'Signed up', 'Activated', 'Subscribed', 'Renewed'],
            dataLabels: { enabled: true, formatter: '{value|compact} \u00b7 {percent|percent:0}' },
            legend: { show: false }
        }
    }
];

/**
 * An options object as the source that would have written it. Everything the
 * engine takes is plain data, so this is a formatting job rather than a
 * serialiser: quoted keys lose their quotes and strings take the quotes the
 * repository writes.
 */
export function source(value: unknown): string {
    return JSON.stringify(value, null, 4)
        .replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')
        .replace(/"/g, "'");
}

export function snippetOf(entry: ChartEntry): string {
    return `const series = ${source(entry.series)};\n\nconst options = ${source(entry.options)};`;
}

export const entryOfChart = (id: string) => chartEntries.find((entry) => entry.id === id);

/** A gallery chart's name and note in the page's language, from `locales/<lang>/charts.json` → `charts.<id>`. */
export function chartText(entry: ChartEntry): { name: string; note: string } {
    return { name: lookup('charts', `charts.${entry.id}.name`) ?? entry.name, note: lookup('charts', `charts.${entry.id}.note`) ?? entry.note };
}
