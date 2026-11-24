<script setup lang="ts">
import { Button, Column, ColumnGroup, DataGrid, Icon, useVitral } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

interface Quote {
    id: number;
    symbol: string;
    name: string;
    open: number;
    high: number;
    low: number;
    last: number;
    volume: number;
}

let seed = 17;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sectors = ['Energy', 'Retail', 'Mining', 'Software', 'Shipping', 'Foods', 'Media', 'Health', 'Rail', 'Water'];

const quotes = shallowRef<Quote[]>(
    Array.from({ length: 400 }, (_, i) => {
        const open = Math.round((5 + random() * 300) * 100) / 100;
        const symbol = Array.from({ length: 3 + (i % 2) }, () => letters[Math.floor(random() * 26)]).join('');
        return { id: i + 1, symbol, name: `${symbol[0]}${symbol.slice(1).toLowerCase()} ${sectors[i % sectors.length]}`, open, high: open, low: open, last: open, volume: Math.floor(random() * 50_000) };
    })
);

// A tenth of the book moves on every tick: each quote that moved is a new object, so the grid sees it change.
function tick() {
    quotes.value = quotes.value.map((quote) => {
        if (random() > 0.1) return quote;
        const last = Math.max(0.01, Math.round(quote.last * (1 + (random() - 0.5) * 0.02) * 100) / 100);
        return { ...quote, last, high: Math.max(quote.high, last), low: Math.min(quote.low, last), volume: quote.volume + Math.floor(random() * 900) };
    });
}

const sortField = ref<string | null>('symbol');
const sortOrder = ref<number | null>(1);
const running = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => running.value && tick(), 900)));
onBeforeUnmount(() => clearInterval(timer));

const { config } = useVitral();
const price = computed(() => new Intl.NumberFormat(config.locale.code, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const percent = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'percent', minimumFractionDigits: 2, signDisplay: 'exceptZero' }));
const compact = computed(() => new Intl.NumberFormat(config.locale.code, { notation: 'compact' }));
const change = (quote: Quote) => quote.last - quote.open;
const direction = (quote: Quote) => (change(quote) > 0 ? 'up' : change(quote) < 0 ? 'down' : 'flat');
</script>

<template>
    <DataGrid
        :value="quotes"
        data-key="id"
        aria-label="Quotes"
        virtual-scroll
        :row-height="30"
        flash-cells
        scroll-height="420px"
        size="small"
        show-gridlines
        v-model:sort-field="sortField"
        v-model:sort-order="sortOrder"
        class="demo-desk"
    >
        <template #header>
            <div class="demo-table-bar">
                <strong>Market</strong>
                <span class="demo-muted">{{ quotes.length }} instruments, updated as they trade</span>
                <Button size="small" severity="secondary" variant="outlined" :icon="running ? 'pause' : 'play'" :label="running ? 'Pause' : 'Resume'" class="demo-end" @click="running = !running" />
            </div>
        </template>
        <Column field="symbol" header="Symbol" sortable pinned="left">
            <template #body="{ data }"><strong>{{ data.symbol }}</strong></template>
        </Column>
        <Column field="name" header="Name" sortable />
        <ColumnGroup header="Price">
            <Column field="last" header="Last" sortable align="right">
                <template #body="{ data }">{{ price.format(data.last) }}</template>
            </Column>
            <Column column-key="change" header="Change" align="right">
                <template #body="{ data }">
                    <span :class="['demo-move', `demo-move-${direction(data)}`]">
                        <Icon v-if="direction(data) !== 'flat'" :icon="direction(data) === 'up' ? 'caretUp' : 'caretDown'" />
                        {{ price.format(change(data)) }}
                    </span>
                </template>
            </Column>
            <Column column-key="percent" header="%" align="right">
                <template #body="{ data }">
                    <span :class="`demo-move-${direction(data)}`">{{ percent.format(change(data) / data.open) }}</span>
                </template>
            </Column>
        </ColumnGroup>
        <ColumnGroup header="Session">
            <Column field="open" header="Open" align="right">
                <template #body="{ data }">{{ price.format(data.open) }}</template>
            </Column>
            <Column field="high" header="High" align="right">
                <template #body="{ data }">{{ price.format(data.high) }}</template>
            </Column>
            <Column field="low" header="Low" align="right">
                <template #body="{ data }">{{ price.format(data.low) }}</template>
            </Column>
        </ColumnGroup>
        <Column field="volume" header="Volume" sortable align="right">
            <template #body="{ data }">{{ compact.format(data.volume) }}</template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-desk {
    width: 100%;
    font-variant-numeric: tabular-nums;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.demo-end {
    margin-inline-start: auto;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}

.demo-move {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
}

.demo-move-up {
    color: var(--vt-success-color);
}

.demo-move-down {
    color: var(--vt-danger-color);
}
</style>
