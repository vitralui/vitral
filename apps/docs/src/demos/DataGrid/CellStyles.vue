<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

interface Server {
    id: number;
    host: string;
    region: string;
    cpu: number;
    latency: number;
    online: boolean;
}

const servers: Server[] = [
    { id: 1, host: 'api-01', region: 'São Paulo', cpu: 42, latency: 38, online: true },
    { id: 2, host: 'api-02', region: 'São Paulo', cpu: 91, latency: 212, online: true },
    { id: 3, host: 'jobs-01', region: 'Frankfurt', cpu: 67, latency: 95, online: true },
    { id: 4, host: 'jobs-02', region: 'Frankfurt', cpu: 0, latency: 0, online: false },
    { id: 5, host: 'edge-01', region: 'Tōkyō', cpu: 18, latency: 24, online: true },
    { id: 6, host: 'edge-02', region: 'Tōkyō', cpu: 78, latency: 140, online: true }
];

type Cell = { value: unknown; row: Server };

// A class by value, a style by value, a class for the whole row: the three ways a look follows the data.
const load = ({ value, row }: Cell) => (!row.online ? null : (value as number) >= 85 ? 'load-high' : (value as number) >= 60 ? 'load-mid' : 'load-low');
const bar = ({ value, row }: Cell) => (row.online ? { '--load': `${value}%` } : {});
const slow = ({ value, row }: Cell) => (row.online && (value as number) > 150 ? { color: 'var(--vt-danger-color)', fontWeight: '600' } : {});
const offline = (row: Server) => (row.online ? undefined : 'server-offline');
const why = ({ value, row }: Cell) => (!row.online ? 'No answer for 6 minutes' : (value as number) > 150 ? 'Over the 150 ms the service promises' : null);
const percent = (value: unknown) => `${value}%`;
const ms = (value: unknown) => `${value} ms`;
</script>

<template>
    <DataGrid :value="servers" data-key="id" aria-label="Servers" :row-class="offline" class="demo-table">
        <Column field="host" header="Host" />
        <Column field="region" header="Region" />
        <Column field="cpu" header="CPU" align="right" :body-class="load" :body-style="bar" :value-formatter="percent" />
        <Column field="latency" header="Latency" align="right" :body-style="slow" :tooltip="why" :value-formatter="ms" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

/* The load drawn behind the number, in the colour of how high it is. */
.demo-table :deep(.load-low),
.demo-table :deep(.load-mid),
.demo-table :deep(.load-high) {
    background: linear-gradient(to left, color-mix(in srgb, var(--tone) 22%, transparent) var(--load), transparent var(--load));
}

.demo-table :deep(.load-low) {
    --tone: var(--vt-success-color);
}

.demo-table :deep(.load-mid) {
    --tone: var(--vt-warn-color);
}

.demo-table :deep(.load-high) {
    --tone: var(--vt-danger-color);
}

.demo-table :deep(.server-offline) {
    color: var(--vt-text-muted-color);
    text-decoration: line-through;
}
</style>
