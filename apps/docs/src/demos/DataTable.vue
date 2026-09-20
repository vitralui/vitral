<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataTable',
    category: 'Data',
    description:
        'The small table: `<DataTable :value><DataTable.Column field header sortable /></DataTable>`. Rows already in hand, shown — sorted by one column at a time, striped, ruled, sized, with a head that can stick to the top of its own scroller. It is a real <table> with `<th scope="col">`, a button in the head of a sortable column and `aria-sort` on that header. Everything a table grows into once it is doing real work — paging, filters, selection, editing, columns the reader resizes, reorders and freezes — is DataGrid, which wears the same layout, so a page that outgrows this one changes component without changing looks.'
};
</script>

<script setup lang="ts">
import { DataTable } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

interface Release {
    version: string;
    name: string;
    published: string;
    downloads: number;
}

const releases: Release[] = [
    { version: '0.4.0', name: 'Spreadsheet', published: '2026-08-14', downloads: 12840 },
    { version: '0.3.2', name: 'Taskboard', published: '2026-06-02', downloads: 9310 },
    { version: '0.3.0', name: 'Schedule', published: '2026-04-21', downloads: 24105 },
    { version: '0.2.1', name: 'Chart', published: '2026-02-09', downloads: 31760 },
    { version: '0.2.0', name: 'Editor', published: '2025-12-18', downloads: 8422 },
    { version: '0.1.0', name: 'Foundations', published: '2025-10-30', downloads: 4190 }
];

const number = new Intl.NumberFormat('en-US');
const date = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
    <DemoSection title="Default" description="Rows in the order they were given. Nothing else is switched on.">
        <DataTable :value="releases" data-key="version" aria-label="Releases">
            <DataTable.Column field="version" header="Version" />
            <DataTable.Column field="name" header="Name" />
            <DataTable.Column field="published" header="Published" />
        </DataTable>
    </DemoSection>

    <DemoSection title="Sortable" description="Click a header to sort by it: ascending, then descending, then back to the order the rows arrived in. One column at a time — a sort over several columns is DataGrid's.">
        <DataTable :value="releases" data-key="version" striped-rows row-hover aria-label="Releases by column">
            <DataTable.Column field="version" header="Version" sortable />
            <DataTable.Column field="name" header="Name" sortable />
            <DataTable.Column field="published" header="Published" sortable>
                <template #body="{ data }">{{ date((data as Release).published) }}</template>
            </DataTable.Column>
            <DataTable.Column field="downloads" header="Downloads" sortable align="right">
                <template #body="{ data }">{{ number.format((data as Release).downloads) }}</template>
            </DataTable.Column>
        </DataTable>
    </DemoSection>

    <DemoSection title="Grid lines, sizes and a header of your own" description="A line between columns as well as between rows, tighter or roomier cells, and the header and footer as content you write.">
        <DataTable :value="releases.slice(0, 4)" data-key="version" show-gridlines size="small" aria-label="Recent releases">
            <template #header><strong>Recent releases</strong></template>
            <DataTable.Column field="version" header="Version" />
            <DataTable.Column field="name" header="Name" />
            <DataTable.Column field="downloads" header="Downloads" align="right">
                <template #body="{ data }">{{ number.format((data as Release).downloads) }}</template>
            </DataTable.Column>
            <template #footer>{{ releases.length }} releases in all</template>
        </DataTable>
    </DemoSection>

    <DemoSection title="Its own scroller" description="Given a height, the table scrolls inside it and the head stays put. The stuck head takes an opaque background, or rows would show through it.">
        <DataTable :value="releases" data-key="version" scroll-height="11rem" striped-rows aria-label="Releases, scrolling">
            <DataTable.Column field="version" header="Version" sortable />
            <DataTable.Column field="name" header="Name" sortable />
            <DataTable.Column field="published" header="Published" />
        </DataTable>
    </DemoSection>

    <DemoSection title="Nothing to show" description="With no rows, one cell spans the table and says so. `empty` — the slot or `<DataTable.Empty>` — replaces the words.">
        <DataTable :value="[]" aria-label="No releases">
            <DataTable.Column field="version" header="Version" />
            <DataTable.Column field="name" header="Name" />
            <DataTable.Empty>No releases yet. The first one is on its way.</DataTable.Empty>
        </DataTable>
    </DemoSection>
</template>
