<script setup lang="ts">
import { Button, Chart, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';
import { computed, onBeforeUnmount, ref } from 'vue';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// A candlestick over its volume: one group.
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
</script>

<template>
    <StackPanel spacing="0.25rem" style="width: 100%">
        <div style="display: flex; align-items: center; gap: 0.75rem">
            <Button size="small" severity="secondary" variant="outlined" :aria-pressed="live" @click="toggleLive">{{ live ? 'Stop the feed' : 'Start the feed' }}</Button>
            <small style="color: var(--vt-text-muted-color)">Last {{ money(session.high) }} high · {{ money(session.low) }} low · prev close {{ money(session.prevClose) }}</small>
        </div>
        <Chart type="candlestick" :series="price" :options="priceOptions" />
        <Chart type="bar" :series="volume" :options="volumeOptions" />
    </StackPanel>
</template>
