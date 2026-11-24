<script setup lang="ts">
import { Button, Column, DataGrid, useVitral } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

interface Fund {
    id: number;
    name: string;
    manager: string;
    /** The last twenty closing prices, oldest first. */
    prices: number[];
    /** Money in and out, by month: a withdrawal is below zero. */
    flows: number[];
    /** How much of the fund is in shares, from 0 to 100. */
    equity: number;
}

let seed = 41;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const names = ['Atlas Income', 'Boreal Growth', 'Cobalt Bonds', 'Delta Real Estate', 'Estuary Balanced', 'Fjord Small Caps', 'Granite Dividend', 'Harbor Treasury', 'Iris Technology', 'Juniper Global'];
const managers = ['R. Okafor', 'L. Brandt', 'M. Sato', 'T. Varga', 'C. Moreau'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function walk(start: number, steps: number) {
    const out = [start];
    for (let i = 1; i < steps; i++) out.push(Math.max(1, Math.round(out[i - 1]! * (1 + (random() - 0.48) * 0.05) * 100) / 100));
    return out;
}

const funds = shallowRef<Fund[]>(
    names.map((name, i) => ({
        id: i + 1,
        name,
        manager: managers[i % managers.length]!,
        prices: walk(20 + Math.round(random() * 180), 20),
        flows: months.map(() => Math.round((random() - 0.35) * 400)),
        equity: Math.round(random() * 100)
    }))
);

// Every tick a few funds close a new price: the oldest drops off, so the line moves left.
function tick() {
    funds.value = funds.value.map((fund) => {
        if (random() > 0.4) return fund;
        const last = fund.prices[fund.prices.length - 1]!;
        return { ...fund, prices: [...fund.prices.slice(1), Math.max(1, Math.round(last * (1 + (random() - 0.48) * 0.05) * 100) / 100)] };
    });
}

const running = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => running.value && tick(), 1200)));
onBeforeUnmount(() => clearInterval(timer));

const { config } = useVitral();
const price = computed(() => new Intl.NumberFormat(config.locale.code, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const money = computed(() => new Intl.NumberFormat(config.locale.code, { signDisplay: 'exceptZero' }));
const last = (fund: Fund) => fund.prices[fund.prices.length - 1]!;
const change = (fund: Fund) => last(fund) / fund.prices[0]! - 1;

const trend = { type: 'line' as const, markers: ['min', 'max', 'last'] as ('min' | 'max' | 'last')[], format: (v: number) => price.value.format(v) };
const flows = { type: 'column' as const, labels: months, format: (v: number) => `${money.value.format(v)}k` };
const area = { type: 'area' as const, domain: 'column' as const, tooltip: false };
const equity = { type: 'bar' as const, domain: [0, 100] as [number, number], format: (v: number) => `${v}%`, color: (p: { value: number }) => (p.value > 75 ? 'var(--vt-warn-color)' : undefined) };
</script>

<template>
    <DataGrid :value="funds" data-key="id" aria-label="Funds" size="small" show-gridlines>
        <template #header>
            <div class="demo-table-bar">
                <strong>Funds</strong>
                <span class="demo-muted">Twenty closing prices, a year of flows, and the share in equities</span>
                <Button size="small" severity="secondary" variant="outlined" :icon="running ? 'pause' : 'play'" :label="running ? 'Pause' : 'Resume'" class="demo-end" @click="running = !running" />
            </div>
        </template>
        <Column field="name" header="Fund" sortable :width="170" />
        <Column field="manager" header="Manager" :width="110" />
        <Column header="Last" align="right" :width="90">
            <template #body="{ data }">{{ price.format(last(data)) }}</template>
        </Column>
        <Column header="20 days" align="right" :width="80">
            <template #body="{ data }">
                <span :class="change(data) < 0 ? 'demo-down' : 'demo-up'">{{ (change(data) * 100).toFixed(1) }}%</span>
            </template>
        </Column>
        <Column field="prices" header="Trend" :width="150" :sparkline="trend" description="Closing prices, each against its own range; the dots are the lowest, the highest and the last." />
        <Column field="prices" column-key="scale" header="On one scale" :width="150" :sparkline="area" description="The same prices, every fund on the range of all of them." />
        <Column field="flows" header="Flows by month" :width="160" :sparkline="flows" description="Money in and out each month, in thousands; a withdrawal hangs below the line." />
        <Column field="equity" header="In equities" :width="160" :sparkline="equity" description="The share held in shares; above 75% it is drawn in the warning colour." />
    </DataGrid>
</template>

<style scoped>
.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}

.demo-end {
    margin-inline-start: auto;
}

.demo-up {
    color: var(--vt-success-color);
}

.demo-down {
    color: var(--vt-danger-color);
}
</style>
