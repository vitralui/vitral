<script setup lang="ts">
import { Button, Column, DataGrid, useVitral } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

interface Rate {
    id: number;
    pair: string;
    bid: number;
    ask: number;
    change: number;
}

// A small deterministic generator, so the rates move the same way every visit.
let seed = 5;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const start: [string, number][] = [
    ['EUR / USD', 1.0842],
    ['GBP / USD', 1.2671],
    ['USD / BRL', 5.0123],
    ['USD / JPY', 151.32],
    ['USD / CHF', 0.9048],
    ['AUD / USD', 0.6587]
];
const rates = shallowRef<Rate[]>(start.map(([pair, mid], i) => ({ id: i + 1, pair, bid: mid, ask: mid * 1.0002, change: 0 })));

// A few rates move on each tick: a moved rate is a new object, so the grid sees what changed and flashes it.
function tick() {
    rates.value = rates.value.map((rate) => {
        if (random() > 0.35) return rate;
        const bid = rate.bid * (1 + (random() - 0.5) * 0.002);
        return { ...rate, bid, ask: bid * 1.0002, change: rate.change + (bid / rate.bid - 1) * 100 };
    });
}

const running = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => running.value && tick(), 1200)));
onBeforeUnmount(() => clearInterval(timer));

const { config } = useVitral();
const digits = (pair: string) => (pair.includes('JPY') ? 2 : 4);
const price = computed(() => (value: unknown, row?: Rate) => (value as number).toFixed(digits(row?.pair ?? '')));
const change = computed(() => (value: unknown) => new Intl.NumberFormat(config.locale.code, { signDisplay: 'exceptZero', maximumFractionDigits: 3 }).format(value as number) + '%');
const sign = ({ value }: { value: unknown }) => ((value as number) < 0 ? { color: 'var(--vt-danger-color)' } : (value as number) > 0 ? { color: 'var(--vt-success-color)' } : {});
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div>
            <Button :label="running ? 'Pause' : 'Resume'" :icon="running ? 'pause' : 'play'" size="small" variant="outlined" @click="running = !running" />
        </div>
        <!-- A number that went up flashes in one colour, one that went down in another; 700 ms each. -->
        <DataGrid :value="rates" data-key="id" aria-label="Exchange rates" :flash-cells="700" style="width: 100%">
            <Column field="pair" header="Pair" />
            <Column field="bid" header="Bid" align="right" :value-formatter="price" />
            <Column field="ask" header="Ask" align="right" :value-formatter="price" />
            <Column field="change" header="Today" align="right" :value-formatter="change" :body-style="sign" />
        </DataGrid>
    </div>
</template>
