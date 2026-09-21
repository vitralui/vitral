<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Chart',
    category: 'Data',
    description:
        'SVG charts with no dependency, driven by one options object in the shape ApexCharts made familiar, and plain data throughout, so it survives JSON. Line, area, bar, lollipop, scatter, bubble, heat map, candlestick, pie, donut, radar, waterfall, range bar, range area, histogram, box plot, funnel, stream, bullet, treemap, sunburst, calendar, radial bars and a gauge; nice scales, shared tooltips, a legend that toggles series, zoom by dragging — a finger holds still first, so a swipe over a chart reads it rather than zooming it — a toolbar, brushes and synced groups. Each chart is named by a generated summary, and its plot takes focus: the arrow keys read it point by point.'
};
</script>

<script setup lang="ts">
import type { ChartHandle } from '@vitral/chart';
import { Chart, Tag, type ChartKind, type ChartOptions, type ChartSeries } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import DemoSection from '../DemoSection.vue';
import CodeBlock from '../parts/CodeBlock.vue';
import { href } from '../lib/router';
import { mountSalesChart, switchType } from './vanilla/salesChart';
import salesChartSource from './vanilla/salesChart.ts?raw';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

// ---- new numbers, arriving
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
let reading = 0;
const quarterly = [
    [
        { name: 'Europe', data: [44, 55, 41, 67] },
        { name: 'Americas', data: [13, 23, 20, 8] }
    ],
    [
        { name: 'Europe', data: [61, 38, 72, 49] },
        { name: 'Americas', data: [28, 45, 12, 33] }
    ],
    [
        { name: 'Europe', data: [30, 70, 55, 35] },
        { name: 'Americas', data: [40, 18, 38, 22] }
    ]
] satisfies ChartSeries[];
const moving = ref<ChartSeries>(quarterly[0]!);
const nextReading = () => {
    reading = (reading + 1) % quarterly.length;
    moving.value = quarterly[reading]!;
};
const movingOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: quarters },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    legend: { position: 'top', horizontalAlign: 'left', value: { show: true } }
};

// ---- the shape and the order of the movement
const easings = ['linear', 'easein', 'easeout', 'easeinout'] as const;
const easing = ref<(typeof easings)[number]>('easeout');
const gradually = ref(true);
const replay = ref(0);
const animationOptions = computed<ChartOptions>(() => ({
    ...quiet,
    xaxis: { categories: quarters },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    legend: { position: 'top', horizontalAlign: 'left' },
    chart: { ...quiet.chart, animations: { enabled: true, speed: 900, easing: easing.value, animateGradually: { enabled: gradually.value, delay: 220 } } }
}));

// ---- the key as a readout
const legendValueOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: months },
    stroke: { curve: 'smooth', width: 2 },
    legend: { position: 'top', horizontalAlign: 'left', value: { show: true, source: 'last', formatter: '{value}' } }
};

// ---- bands behind the line
const bandedOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: months },
    stroke: { curve: 'smooth', width: 3 },
    legend: { show: false },
    annotations: {
        position: 'back',
        yaxis: [
            { y: 200, y2: 400, fillColor: 'var(--vt-chart-3)', opacity: 0.1, label: { text: 'Quiet', position: 'left' } },
            { y: 700, y2: 1000, fillColor: 'var(--vt-chart-6)', opacity: 0.1, label: { text: 'Busy', position: 'left' } }
        ],
        xaxis: [{ x: 'Jul', x2: 'Sep', fillColor: 'var(--vt-chart-5)', opacity: 0.12, label: { text: 'Campaign' } }]
    }
};

// ---- one readout or the whole column
const sharedTooltip: ChartOptions = { ...quiet, xaxis: { categories: quarters }, legend: { position: 'top', horizontalAlign: 'left' } };
const singleTooltip: ChartOptions = { ...sharedTooltip, tooltip: { shared: false, intersect: true } };

// ---- lines and areas
const traffic: ChartSeries = [
    { name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] },
    { name: 'Sign-ups', data: [42, 51, 48, 66, 80, 71, 95, 88, 110, 102, 126, 140] }
];
const lineOptions: ChartOptions = {
    xaxis: { categories: months },
    yaxis: [{ title: { text: 'Visitors' } }, { opposite: true, title: { text: 'Sign-ups' } }],
    stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
    markers: { size: [0, 4] },
    title: { text: 'Visitors and sign-ups', align: 'left' },
    subtitle: { text: 'Two axes, one per series' }
};
const areaOptions: ChartOptions = {
    chart: { stacked: true },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: '{value|compact}' } },
    stroke: { curve: 'monotoneCubic', width: 2 },
    tooltip: { y: { formatter: '{value|integer} requests' } }
};
const requests: ChartSeries = [
    { name: 'API', data: [1200, 1500, 1400, 1800, 2100, 1900, 2400, 2600, 2500, 2900, 3100, 3300] },
    { name: 'Web', data: [800, 900, 1100, 1000, 1300, 1500, 1400, 1600, 1800, 1700, 2000, 2200] },
    { name: 'Jobs', data: [300, 280, 350, 400, 380, 420, 460, 500, 480, 530, 560, 600] }
];

// ---- bars
const barKinds = ['grouped', 'stacked', '100%', 'horizontal'] as const;
const barKind = ref<(typeof barKinds)[number]>('grouped');
const regions: ChartSeries = [
    { name: 'North', data: [44, 55, 41, 67] },
    { name: 'South', data: [13, 23, 20, 8] },
    { name: 'East', data: [11, 17, 15, 15] }
];
const barOptions = computed<ChartOptions>(() => ({
    chart: { stacked: barKind.value === 'stacked' || barKind.value === '100%', stackType: barKind.value === '100%' ? '100%' : 'normal' },
    plotOptions: {
        bar: {
            horizontal: barKind.value === 'horizontal',
            borderRadius: 5,
            borderRadiusWhenStacked: 'last',
            columnWidth: '60%',
            dataLabels: { total: { enabled: barKind.value === 'stacked' } }
        }
    },
    dataLabels: { enabled: barKind.value !== 'grouped', formatter: barKind.value === '100%' ? '{value}' : '{value}' },
    xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yaxis: { labels: { formatter: barKind.value === '100%' ? '{value|percent}' : '{value}' } },
    legend: { position: 'top', horizontalAlign: 'right' }
}));

const lollipopOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: ['Lisboa', 'Porto', 'Braga', 'Faro', 'Coimbra', 'Aveiro', 'Évora', 'Leiria'] },
    plotOptions: { bar: { horizontal: true }, lollipop: { markerSize: 12, stemWidth: 2 } },
    dataLabels: { enabled: true, formatter: '{value|fixed:1}', style: { color: 'var(--vt-text-color)' } },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } }
};
const lollipop: ChartSeries = [{ name: 'Rating', data: [4.6, 4.4, 4.1, 3.9, 3.8, 3.6, 3.4, 3.2] }];

// ---- scatter and bubbles
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const random = seeded(7);
const scatter: ChartSeries = ['Team A', 'Team B'].map((name, t) => ({
    name,
    data: Array.from({ length: 28 }, () => [Math.round((20 + random() * 60 + t * 12) * 10) / 10, Math.round((30 + random() * 40 + t * 15) * 10) / 10] as [number, number])
}));
const scatterOptions: ChartOptions = {
    xaxis: { title: { text: 'Hours of practice' } },
    yaxis: { title: { text: 'Score' } },
    markers: { shape: ['circle', 'diamond'], size: 8 },
    annotations: { yaxis: [{ y: 70, label: { text: 'Pass mark' } }] }
};
const bubbles: ChartSeries = [
    { name: 'Europe', data: [{ x: 12, y: 60, z: 450 }, { x: 25, y: 72, z: 83 }, { x: 34, y: 55, z: 67 }] },
    { name: 'Americas', data: [{ x: 18, y: 40, z: 330 }, { x: 42, y: 65, z: 210 }, { x: 55, y: 48, z: 39 }] }
];
const bubbleOptions: ChartOptions = { ...quiet, xaxis: { title: { text: 'Growth %' } }, tooltip: { z: { title: 'Population (M)' } }, dataLabels: { enabled: true, formatter: '{value}' } };

// ---- heat map
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = ['06', '08', '10', '12', '14', '16', '18', '20', '22'];
const busy = seeded(3);
const heat: ChartSeries = days.map((d, di) => ({ name: d, data: hours.map((x, hi) => ({ x, y: Math.round((di > 4 ? 20 : 50) + Math.sin(hi / 2) * 30 + busy() * 20) })) }));
const heatOptions: ChartOptions = { ...quiet, colors: ['var(--vt-chart-1)'], plotOptions: { heatmap: { shadeSteps: 5, radius: 3 } }, tooltip: { y: { formatter: '{value} commits' } } };

// ---- the six that read a number a different way
const cash: ChartSeries = [{ name: 'Cash', data: [1200, 420, -180, 310, -260, 140, null] }];
const cashOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: ['Opening', 'Sales', 'Refunds', 'Services', 'Costs', 'Other', 'Closing'] },
    // The last column is a total: it is drawn from zero to the running sum
    // rather than as another step.
    plotOptions: { waterfall: { totals: [6] } },
    yaxis: { labels: { formatter: '{value|compact}' } },
    dataLabels: { enabled: true, formatter: '{value|compact}' }
};

const shifts: ChartSeries = [{ name: 'On call', data: [{ x: 'Ana', y: [8, 16] }, { x: 'Bruno', y: [12, 20] }, { x: 'Célia', y: [16, 24] }, { x: 'Dan', y: [0, 8] }] }];
const shiftOptions: ChartOptions = {
    ...quiet,
    plotOptions: { bar: { horizontal: true } },
    // Turned on its side the value axis is the y one, so the title goes there.
    yaxis: { title: { text: 'Hour of the day' } },
    tooltip: { y: { formatter: '{value}:00' } }
};

const forecast: ChartSeries = [
    { name: 'Likely range', type: 'rangeArea', data: months.map((x, i) => ({ x, y: [40 + i * 4, 78 + i * 7] as [number, number] })) },
    { name: 'Forecast', type: 'line', data: months.map((_, i) => 59 + i * 5.5) }
];
const forecastOptions: ChartOptions = { ...quiet, xaxis: { categories: months }, stroke: { curve: 'smooth', width: [1, 3] }, yaxis: { title: { text: 'Orders' } } };

// Raw readings: the chart counts them into bins itself.
const noise = seeded(17);
const latencies = Array.from({ length: 400 }, () => Math.round(40 + Math.abs(noise() + noise() + noise() - 1.5) * 90));
const latencySeries: ChartSeries = [{ name: 'Response time', data: latencies }];
const latencyOptions: ChartOptions = {
    ...quiet,
    plotOptions: { histogram: { bins: 16 } },
    xaxis: { title: { text: 'Milliseconds' } },
    yaxis: { title: { text: 'Requests' } },
    colors: ['var(--vt-chart-5)']
};

const spread: ChartSeries = [
    {
        name: 'Response time',
        data: [
            { x: 'API', y: [12, 28, 41, 63, 140] as [number, number, number, number, number] },
            { x: 'Web', y: [30, 52, 68, 90, 180] as [number, number, number, number, number] },
            { x: 'Jobs', y: [8, 15, 22, 34, 70] as [number, number, number, number, number] },
            { x: 'Search', y: [18, 34, 49, 71, 155] as [number, number, number, number, number] }
        ]
    }
];
const spreadOptions: ChartOptions = { ...quiet, yaxis: { title: { text: 'Milliseconds' } }, colors: ['var(--vt-chart-2)'] };

const signups: ChartSeries = [{ name: 'Signups', data: [4820, 3100, 1740, 980, 610] }];
const funnelOptions: ChartOptions = {
    ...quiet,
    labels: ['Visited', 'Signed up', 'Activated', 'Subscribed', 'Renewed'],
    plotOptions: { funnel: { neck: '30%', gap: 4 } },
    dataLabels: { enabled: true, formatter: '{seriesName}: {value|compact} ({percent|percent:0})' }
};

// ---- the second leaf: shapes that are not marks on a pair of axes
const traffic2: ChartSeries = ['Search', 'Direct', 'Social', 'Mail', 'Referral'].map((name, row) => ({
    name,
    data: months.map((_, i) => Math.round(30 + Math.sin((i + row * 2) / 1.7) * 18 + row * 6 + i * (row % 2 ? 1.5 : 3)))
}));
const streamOptions: ChartOptions = { ...quiet, xaxis: { categories: months }, tooltip: { shared: true } };

const against: ChartSeries = [
    {
        name: 'Against target',
        data: [
            { x: 'Revenue', y: 78, target: 90 },
            { x: 'Signups', y: 112, target: 100 },
            { x: 'Retention', y: 64, target: 75 },
            { x: 'Margin', y: 41, target: 50 }
        ]
    }
];
const bulletOptions: ChartOptions = {
    ...quiet,
    // The bands are the scale a bullet is read against: poor, fair, good.
    plotOptions: { bullet: { ranges: [{ from: 0, to: 130 }, { from: 0, to: 90 }, { from: 0, to: 55 }] } },
    tooltip: { y: { formatter: '{value}%' } }
};

const regionsTree: ChartSeries = [
    { name: 'Europe', data: [{ x: 'Germany', y: 84 }, { x: 'France', y: 68 }, { x: 'Spain', y: 47 }, { x: 'Portugal', y: 12 }] },
    { name: 'Americas', data: [{ x: 'United States', y: 132 }, { x: 'Brazil', y: 72 }, { x: 'Mexico', y: 39 }] },
    { name: 'Asia', data: [{ x: 'Japan', y: 61 }, { x: 'India', y: 55 }, { x: 'Singapore', y: 14 }] }
];
const treemapOptions: ChartOptions = { ...quiet, legend: { show: true, position: 'bottom' } };
const sunburstOptions: ChartOptions = { ...quiet };

// A parent a point names builds a tree of any depth, rather than the two
// levels a list of series gives.
const roles: ChartSeries = [
    {
        name: 'Headcount',
        data: [
            { x: 'Engineering', y: 0 },
            { x: 'Product', y: 0 },
            { x: 'Platform', y: 18, parent: 'Engineering' },
            { x: 'Web', y: 14, parent: 'Engineering' },
            { x: 'Mobile', y: 9, parent: 'Engineering' },
            { x: 'Design', y: 7, parent: 'Product' },
            { x: 'Research', y: 4, parent: 'Product' },
            { x: 'iOS', y: 5, parent: 'Mobile' },
            { x: 'Android', y: 4, parent: 'Mobile' }
        ]
    }
];

const usage: ChartSeries = [
    { name: 'Storage', data: [72] },
    { name: 'Memory', data: [48] },
    { name: 'CPU', data: [35] }
];
const radialOptions: ChartOptions = { ...quiet, legend: { show: true, position: 'bottom' } };
const gaugeOptions: ChartOptions = { ...quiet, colors: ['var(--vt-chart-3)'], plotOptions: { radialBar: { min: 90, max: 100 } }, dataLabels: { formatter: '{value}%' } };

// A year of daily activity, from a fixed seed so the page is the same twice.
const daily = seeded(23);
const commits: ChartSeries = [
    {
        name: 'Commits',
        data: Array.from({ length: 365 }, (_, i) => {
            const date = new Date(2026, 0, 1 + i);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const value = Math.round(daily() * (weekend ? 4 : 14) * (daily() > 0.18 ? 1 : 0));
            return { x: date.getTime(), y: value };
        }).filter((d) => d.y > 0)
    }
];
const calendarOptions: ChartOptions = { ...quiet, plotOptions: { calendar: { weekStart: 1 } }, colors: ['var(--vt-chart-3)'], tooltip: { y: { formatter: '{value} commits' } } };

// ---- a candlestick over its volume: one group
const start = new Date(2026, 5, 1).getTime();
const walk = seeded(11);
let close = 180;
const candles = Array.from({ length: 45 }, (_, i) => {
    const open = close;
    close = Math.round((open + (walk() - 0.48) * 6) * 100) / 100;
    const high = Math.max(open, close) + Math.round(walk() * 300) / 100;
    const low = Math.min(open, close) - Math.round(walk() * 300) / 100;
    return { x: start + i * 86400000, y: [open, high, low, close], volume: Math.round(2000 + walk() * 6000) };
});
// The last candle is the one still being traded: a tick moves its close, and
// its high and low only ever widen. That is what makes the session lines worth
// drawing — they are read off the session, so they move as it does.
const live = ref(false);
const price = ref<ChartSeries>([{ name: 'VTRL', data: candles.map((c) => ({ x: c.x, y: c.y })) }]);
const volume = ref<ChartSeries>([{ name: 'Volume', data: candles.map((c) => ({ x: c.x, y: c.volume })) }]);
const session = ref({ prevClose: candles[candles.length - 2]!.y[3], high: candles[candles.length - 1]!.y[1], low: candles[candles.length - 2]!.y[3] });

const tickWalk = seeded(23);
let ticker = 0;

function tick() {
    const bars = candles.map((c) => ({ ...c, y: [...c.y] as [number, number, number, number] }));
    const last = bars[bars.length - 1]!;
    const previous = bars[bars.length - 2]!;
    const moved = Math.round((last.y[3] + (tickWalk() - 0.5) * 3) * 100) / 100;
    last.y[3] = moved;
    last.y[1] = Math.max(last.y[1], moved);
    last.y[2] = Math.min(last.y[2], moved);
    last.volume = Math.round(last.volume + tickWalk() * 400);
    candles[candles.length - 1] = last;
    price.value = [{ name: 'VTRL', data: bars.map((c) => ({ x: c.x, y: c.y })) }];
    volume.value = [{ name: 'Volume', data: bars.map((c) => ({ x: c.x, y: c.volume })) }];
    session.value = { prevClose: previous.y[3], high: last.y[1], low: last.y[2] };
}

function toggleLive() {
    live.value = !live.value;
    if (live.value) ticker = window.setInterval(tick, 1200);
    else window.clearInterval(ticker);
}
onBeforeUnmount(() => window.clearInterval(ticker));

const money = (n: number) => `$${n.toFixed(2)}`;
const priceOptions = computed<ChartOptions>(() => ({
    chart: { group: 'market', id: 'price', height: 260, animations: { dynamicAnimation: { speed: 900 } } },
    xaxis: { type: 'datetime', labels: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: '{value|currency:USD}' }, forceNiceScale: true },
    tooltip: { x: { format: 'EEE, d MMM yyyy' } },
    legend: { show: false },
    // Three lines read straight off the session, so they travel with it.
    annotations: {
        yaxis: [
            // Dashed, so a line read off the session is never mistaken for one
            // the data drew; the chips take each line's own colour.
            { y: session.value.prevClose, borderColor: 'var(--vt-chart-8)', strokeDashArray: 4, label: { text: `Prev close ${money(session.value.prevClose)}`, position: 'left' } },
            { y: session.value.high, borderColor: 'var(--vt-chart-3)', strokeDashArray: 4, label: { text: `High ${money(session.value.high)}` } },
            { y: session.value.low, borderColor: 'var(--vt-chart-6)', strokeDashArray: 4, label: { text: `Low ${money(session.value.low)}`, position: 'left' } }
        ]
    }
}));
const volumeOptions: ChartOptions = {
    chart: { group: 'market', id: 'volume', height: 140, toolbar: { show: false }, animations: { dynamicAnimation: { speed: 900 } } },
    xaxis: { type: 'datetime' },
    yaxis: { labels: { formatter: '{value|compact}' }, tickAmount: 2 },
    colors: ['var(--vt-chart-8)'],
    plotOptions: { bar: { columnWidth: '70%', borderRadius: 1 } },
    tooltip: { x: { format: 'EEE, d MMM yyyy' } }
};

// ---- a brush
const readings = seeded(5);
let level = 50;
const series1 = Array.from({ length: 240 }, (_, i) => [start + i * 3600000, (level = Math.max(5, Math.round(level + (readings() - 0.5) * 8)))] as [number, number]);
const sensor: ChartSeries = [{ name: 'Temperature', data: series1 }];
const targetOptions: ChartOptions = { chart: { id: 'sensor', height: 240, toolbar: { tools: { download: true } } }, xaxis: { type: 'datetime' }, stroke: { width: 2, curve: 'straight' }, yaxis: { labels: { formatter: '{value} °C' } }, legend: { show: false } };
const brushOptions: ChartOptions = {
    chart: { height: 110, brush: { enabled: true, target: 'sensor' }, selection: { enabled: true, xaxis: { min: series1[60]![0], max: series1[120]![0] } } },
    xaxis: { type: 'datetime' },
    yaxis: { show: false },
    colors: ['var(--vt-chart-4)'],
    legend: { show: false },
    tooltip: { enabled: false }
};

// ---- pies
const budget: ChartSeries = [1200, 450, 380, 290, 160];
const pieKind = ref<ChartKind>('donut');
const pieOptions: ChartOptions = {
    labels: ['Housing', 'Food', 'Transport', 'Leisure', 'Other'],
    plotOptions: { pie: { donut: { labels: { total: { label: 'Monthly', formatter: '{value|currency:EUR}' }, value: { formatter: '{value|currency:EUR}' } } } } },
    tooltip: { y: { formatter: '{value|currency:EUR}' } }
};
const picked = ref('Click or press Enter on a slice.');

// ---- radar
const skills: ChartSeries = [
    { name: 'Ana', data: [80, 50, 30, 40, 100, 20] },
    { name: 'Rui', data: [20, 30, 40, 80, 20, 80] }
];
const radarOptions = (grid: 'web' | 'polygon'): ChartOptions => ({
    ...quiet,
    xaxis: { categories: ['Design', 'Code', 'Ops', 'Data', 'Writing', 'Support'] },
    plotOptions: { radar: { grid } },
    fill: { opacity: grid === 'polygon' ? 0.35 : 0.15 },
    legend: { show: grid === 'web' }
});

// ---- sparklines
const kpis = [
    { label: 'Revenue', value: '$48.2K', type: 'area' as const, data: [12, 14, 13, 17, 19, 18, 22, 24, 23, 27], color: 'var(--vt-chart-3)' },
    { label: 'Churn', value: '2.4%', type: 'line' as const, data: [3.1, 3.0, 2.9, 3.2, 2.8, 2.7, 2.6, 2.5, 2.5, 2.4], color: 'var(--vt-chart-6)' },
    { label: 'Deploys', value: '126', type: 'bar' as const, data: [8, 12, 9, 14, 11, 16, 13, 15, 12, 18], color: 'var(--vt-chart-4)' }
];
const spark = (color: string): ChartOptions => ({ chart: { sparkline: { enabled: true }, height: 48 }, colors: [color], stroke: { width: 2 }, tooltip: { x: { show: false } } });

// ---- the options are data
const editable = ref(
    JSON.stringify(
        {
            chart: { type: 'bar', height: 260 },
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
            yaxis: { labels: { formatter: '{value|compact}' } },
            plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
            dataLabels: { enabled: true, formatter: '{value|compact}', style: { color: '#ffffff' } },
            legend: { show: false },
            responsive: [{ breakpoint: 520, options: { plotOptions: { bar: { horizontal: true } } } }]
        },
        null,
        2
    )
);
const parsed = computed<{ options?: ChartOptions; error?: string }>(() => {
    try {
        return { options: JSON.parse(editable.value) };
    } catch (error) {
        return { error: (error as Error).message };
    }
});
const jsonSeries: ChartSeries = [{ name: 'Orders', data: [12400, 18300, 9800, 21000, 16700] }];

// ---- without a framework: the same chart, drawn by @vitral/chart into a plain element
const vanillaHost = ref<HTMLElement | null>(null);
const vanillaKinds = ['bar', 'line', 'area'] as const;
const vanillaKind = ref<(typeof vanillaKinds)[number]>('bar');
const vanillaPick = ref('Click a bar, or Tab to the plot and press Enter.');
let vanilla: ChartHandle | undefined;
onMounted(() => (vanilla = mountSalesChart(vanillaHost.value!, (text) => (vanillaPick.value = text))));
onBeforeUnmount(() => vanilla?.destroy());
function pickVanillaKind(kind: (typeof vanillaKinds)[number]) {
    vanillaKind.value = kind;
    if (vanilla) switchType(vanilla, kind);
}
</script>

<template>
    <p class="demo-lead">
        Deciding which chart to use is a job for the eye, not for a list of names:
        <a :href="href('/charts')">every kind on one page</a>, live, with what each one is for and the options behind it.
    </p>

    <DemoSection title="Lines" description="Two y axes, each measuring its own series; a dashed second line with markers. Tab to the plot and use the arrow keys.">
        <Chart type="line" :series="traffic" :options="lineOptions" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Stacked area" description="Areas stack, with a gradient fill; axis labels use the compact preset and the tooltip its own template. Click a legend entry to hide a series.">
        <Chart type="area" :series="requests" :options="areaOptions" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Bars and columns" description="The same data grouped, stacked (with totals), stacked to 100% and horizontal. Only the growing end of a bar is rounded.">
        <div class="demo-stack" style="width: 100%">
            <div style="display: flex; gap: 0.5rem" role="group" aria-label="Layout">
                <button v-for="k in barKinds" :key="k" type="button" class="copy-btn" :aria-pressed="barKind === k" @click="barKind = k">{{ k }}</button>
            </div>
            <Chart type="bar" :series="regions" :options="barOptions" style="width: 100%" />
        </div>
    </DemoSection>

    <DemoSection title="Lollipop" description="Bars with most of the ink removed, for many categories with small differences.">
        <Chart type="lollipop" :series="lollipop" :options="lollipopOptions" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Scatter and bubbles" description="A numeric x axis, drag to zoom on both axes (on a touch screen, hold still and then drag), and a y annotation. Bubbles map their value to area, not radius.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="scatter" :series="scatter" :options="scatterOptions" />
            <Chart type="bubble" :series="bubbles" :options="bubbleOptions" />
        </div>
    </DemoSection>

    <DemoSection title="Heat map" description="One colour in five steps: “more of the same colour” needs no legend.">
        <Chart type="heatmap" :series="heat" :options="heatOptions" height="280" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Waterfall" description="Bars that float: each one starts where the running total left off, so the chart shows how a number got from one total to another. `plotOptions.waterfall.totals` names the columns that return to zero.">
        <Chart type="waterfall" :series="cash" :options="cashOptions" height="300" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Range bar and range area" description="A point of `[low, high]` instead of one number: the bar spans the two, and the area fills between them. A line beside the band is a second series.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="rangeBar" :series="shifts" :options="shiftOptions" height="280" />
            <Chart type="rangeArea" :series="forecast" :options="forecastOptions" height="280" />
        </div>
    </DemoSection>

    <DemoSection title="Histogram and box plot" description="Two ways to show a spread. The histogram takes raw readings and bins them itself; the box plot takes the five numbers — minimum, quartiles, median, maximum — a category.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="histogram" :series="latencySeries" :options="latencyOptions" height="280" />
            <Chart type="boxPlot" :series="spread" :options="spreadOptions" height="280" />
        </div>
    </DemoSection>

    <DemoSection title="Funnel" description="Stages of a process, each as wide as its share of the first, so the fall reads as a slope. `{percent}` is in the label formatter because the share is what a funnel is read for.">
        <Chart type="funnel" :series="signups" :options="funnelOptions" height="320" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Stream" description="A stacked area floating on a baseline of its own: the layers share the movement instead of the bottom one carrying it. `plotOptions.stream.offset` chooses how.">
        <Chart type="stream" :series="traffic2" :options="streamOptions" height="300" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Bullet" description="A measure, its target and the bands it falls in — a gauge’s job in a strip a table row can hold. The tick is the target the point carries.">
        <Chart type="bullet" :series="against" :options="bulletOptions" height="260" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Treemap and sunburst" description="Two ways to draw a hierarchy. The treemap packs it into boxes whose areas are the values; the sunburst rings it, a level a ring, so a wedge stays with its family.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="treemap" :series="regionsTree" :options="treemapOptions" height="300" />
            <Chart type="sunburst" :series="regionsTree" :options="sunburstOptions" height="300" />
        </div>
    </DemoSection>

    <DemoSection title="A tree of any depth" description="A point that names a `parent` builds the tree itself, rather than the two levels a list of series gives.">
        <Chart type="sunburst" :series="roles" :options="sunburstOptions" height="340" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Radial bars and a gauge" description="Rings read against their own tracks, and one number against its maximum with the reading in the middle. `plotOptions.radialBar.min` and `max` set what a full ring means.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="radialBar" :series="usage" :options="radialOptions" height="300" />
            <Chart type="gauge" :series="[{ name: 'Uptime', data: [99.4] }]" :options="gaugeOptions" height="300" />
        </div>
    </DemoSection>

    <DemoSection title="Calendar" description="A year of days as a grid of weeks. A line of 365 points shows the trend; this shows the day.">
        <Chart type="calendar" :series="commits" :options="calendarOptions" height="200" style="width: 100%" />
    </DemoSection>

    <DemoSection
        title="Synced charts, trading"
        description="A price and its volume in one group: they share the crosshair, the tooltip and the zoom. Drag across either to zoom both; Shift-drag pans. Start the feed and the last candle becomes the one still being traded — its close moves on every tick, its high and low only ever widen — and the three session lines, read off that candle, move with it. Because the data is interpolated rather than replaced, a tick is a movement instead of a jump."
    >
        <div class="demo-stack" style="width: 100%; gap: 0.25rem">
            <div style="display: flex; align-items: center; gap: 0.75rem">
                <button type="button" class="copy-btn" :aria-pressed="live" @click="toggleLive">{{ live ? 'Stop the feed' : 'Start the feed' }}</button>
                <span class="demo-hint">Last {{ money(session.high) }} high · {{ money(session.low) }} low · prev close {{ money(session.prevClose) }}</span>
            </div>
            <Chart type="candlestick" :series="price" :options="priceOptions" />
            <Chart type="bar" :series="volume" :options="volumeOptions" />
        </div>
    </DemoSection>

    <DemoSection title="Brush" description="The strip below is a brush: drag its window, or drag a new one, and the chart above follows, rescaling its y axis to what it shows.">
        <div class="demo-stack" style="width: 100%">
            <Chart type="line" :series="sensor" :options="targetOptions" />
            <Chart type="area" :series="sensor" :options="brushOptions" />
        </div>
    </DemoSection>

    <DemoSection title="Pie and donut" description="The centre shows the total, or the slice in focus; a click (or Enter) pulls a slice out.">
        <div class="demo-stack" style="width: 100%">
            <div style="display: flex; gap: 0.5rem" role="group" aria-label="Kind">
                <button v-for="k in ['donut', 'pie'] as const" :key="k" type="button" class="copy-btn" :aria-pressed="pieKind === k" @click="pieKind = k">{{ k }}</button>
            </div>
            <Chart :type="pieKind" :series="budget" :options="pieOptions" height="300" @data-point-selection="(e) => (picked = `${pieOptions.labels![e.seriesIndex]}: ${e.selected ? 'selected' : 'released'}`)" />
            <span class="demo-hint">{{ picked }}</span>
        </div>
    </DemoSection>

    <DemoSection title="Radar" description="A web of hairlines for comparing two profiles, and shaded bands for one.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="radar" :series="skills" :options="radarOptions('web')" height="320" />
            <Chart type="radar" :series="[skills[0]!]" :options="radarOptions('polygon')" height="320" />
        </div>
    </DemoSection>

    <DemoSection title="Sparklines" description="`chart.sparkline.enabled`: just the marks, for a stat tile.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; width: 100%">
            <div v-for="k in kpis" :key="k.label" style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; border: 1px solid var(--vt-content-border-color); border-radius: var(--vt-content-border-radius)">
                <span class="demo-hint">{{ k.label }}</span>
                <strong style="font-size: 1.25rem">{{ k.value }}</strong>
                <Chart :type="k.type" :series="[{ name: k.label, data: k.data }]" :options="spark(k.color)" />
            </div>
        </div>
    </DemoSection>

    <DemoSection title="Options are data" description="Edit the JSON: every option here is plain data, which is what a visual editor will write. Narrow the window below 520px and the responsive entry turns the bars.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
            <textarea v-model="editable" aria-label="Chart options as JSON" spellcheck="false" rows="18" style="font-family: var(--vt-font-family-mono); font-size: 0.75rem; padding: 0.5rem; border-radius: var(--vt-content-border-radius); border: 1px solid var(--vt-content-border-color); background: var(--vt-content-background); color: var(--vt-text-color)" />
            <div>
                <Chart v-if="parsed.options" :series="jsonSeries" :options="parsed.options" />
                <Tag v-else severity="danger" :value="parsed.error" />
            </div>
        </div>
    </DemoSection>

    <DemoSection title="Custom tooltip and no data" description="The tooltip slot replaces the readout; a chart with nothing to draw says so.">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="line" :series="[traffic[0]!]" :options="{ xaxis: { categories: months }, ...quiet, chart: { ...quiet.chart, accessibility: { dataTable: true } } }" height="240">
                <template #tooltip="{ title, rows }">
                    <strong>{{ title }}</strong>
                    <span>{{ rows[0]?.value }} visitors</span>
                </template>
            </Chart>
            <Chart type="bar" :series="[]" height="240" />
        </div>
    </DemoSection>

    <DemoSection
        title="New numbers arrive by moving"
        description="Press the button. The bars travel to their new heights instead of appearing at them, so it is visible which way each one went — the values are interpolated and the picture is redrawn each frame, which is why lines, areas and slices move too. `chart.animations.dynamicAnimation` sets the pace or turns it off, and a change that adds or removes a series simply draws, since there is nothing to move through."
    >
        <div class="demo-stack" style="width: 100%">
            <div><button type="button" class="copy-btn" @click="nextReading">New numbers</button></div>
            <Chart type="bar" :series="moving" :options="movingOptions" height="260" style="width: 100%" />
        </div>
    </DemoSection>

    <DemoSection
        title="How a chart moves"
        description="`chart.animations` sets the shape of the movement and whether the series arrive together or one behind the other. The same easing drives the first draw and every change after it, so a chart moves one way. None of it runs for a reader whose system asks for reduced motion."
    >
        <div class="demo-stack" style="width: 100%">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem">
                <div style="display: flex; gap: 0.5rem" role="group" aria-label="Easing">
                    <button v-for="e in easings" :key="e" type="button" class="copy-btn" :aria-pressed="easing === e" @click="((easing = e), replay++)">{{ e }}</button>
                </div>
                <button type="button" class="copy-btn" :aria-pressed="gradually" @click="((gradually = !gradually), replay++)">one at a time</button>
                <button type="button" class="copy-btn" @click="replay++">replay</button>
            </div>
            <Chart :key="replay" type="bar" :series="quarterly[0]!" :options="animationOptions" height="240" style="width: 100%" />
        </div>
    </DemoSection>

    <DemoSection
        title="The key as a readout"
        description="`legend.value` puts a figure beside each series name — its total, where it ended, its highest or lowest — so the question usually asked next to a legend is answered in it. This one shows the last reading of each line."
    >
        <Chart type="line" :series="traffic" :options="legendValueOptions" height="260" style="width: 100%" />
    </DemoSection>

    <DemoSection
        title="Bands behind the marks"
        description="Annotations with a `fillColor` shade a range rather than draw a line: two y bands naming what counts as quiet and busy, and an x band over the months a campaign ran. `position: 'back'` puts them under the data, where a background belongs."
    >
        <Chart type="line" :series="[traffic[0]!]" :options="bandedOptions" height="260" style="width: 100%" />
    </DemoSection>

    <DemoSection
        title="The whole column, or just what is under the pointer"
        description="On the left the tooltip is shared: it lists every series at the category, and picks out the one being pointed at so the panel answers both “how do these compare” and “what am I on”. On the right `tooltip.intersect` says one readout only, and it appears when the pointer is actually over a bar."
    >
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
            <Chart type="bar" :series="quarterly[0]!" :options="sharedTooltip" height="240" />
            <Chart type="bar" :series="quarterly[0]!" :options="singleTooltip" height="240" />
        </div>
    </DemoSection>

    <DemoSection
        title="Using the chart without a framework"
        description="The chart is @vitral/chart, which has no framework in it; <Chart> is a thin wrapper around it. createChart(element, { type, series, options }) draws into any element and returns a handle: update, on, zoomX, exportSvg, destroy. This one is mounted in a plain <div> by the module below."
    >
        <div class="demo-stack" style="width: 100%">
            <div style="display: flex; gap: 0.5rem" role="group" aria-label="Kind">
                <button v-for="k in vanillaKinds" :key="k" type="button" class="copy-btn" :aria-pressed="vanillaKind === k" @click="pickVanillaKind(k)">{{ k }}</button>
            </div>
            <div ref="vanillaHost" />
            <span class="demo-hint">{{ vanillaPick }}</span>
            <CodeBlock :code="salesChartSource" label="salesChart.ts" lang="ts" />
        </div>
    </DemoSection>
</template>
