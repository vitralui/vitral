<script setup lang="ts">
import { Column, DataGrid, useVitral, type DataGridMenuItem } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Doc {
    id: number;
    name: string;
    owner: string;
    size: number;
    modified: Date;
    starred: boolean;
    label: 'None' | 'Draft' | 'Final';
}

const docs = ref<Doc[]>([
    { id: 1, name: 'Budget 2027.xlsx', owner: 'Ana Souza', size: 482_000, modified: new Date(2026, 10, 20), starred: true, label: 'Draft' },
    { id: 2, name: 'Brand guidelines.pdf', owner: 'Kenji Sato', size: 9_830_000, modified: new Date(2026, 9, 2), starred: false, label: 'Final' },
    { id: 3, name: 'Interview notes.docx', owner: 'Lucía Gómez', size: 64_000, modified: new Date(2026, 10, 24), starred: false, label: 'None' },
    { id: 4, name: 'Launch plan.pptx', owner: 'Ana Souza', size: 2_120_000, modified: new Date(2026, 10, 11), starred: false, label: 'Draft' },
    { id: 5, name: 'Supplier contracts.zip', owner: 'Bruno Lima', size: 31_400_000, modified: new Date(2026, 8, 30), starred: true, label: 'Final' }
]);
const said = ref('Right-click a row, or move to a cell with the arrow keys and press the context menu key.');

const change = (id: number, patch: Partial<Doc>) => (docs.value = docs.value.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)));

// The menu is worked out for the row and cell it opened on: actions of the page's own first, a submenu
// with a choice ticked, and then the grid's own items (copy, export) where they were.
const menu = ({ row, items }: { row: Doc; items: DataGridMenuItem[] }): DataGridMenuItem[] => [
    { label: 'Open', icon: 'externalLink', onSelect: () => (said.value = `Opening ${row.name}`) },
    { label: row.starred ? 'Remove star' : 'Star', icon: 'star', onSelect: () => change(row.id, { starred: !row.starred }) },
    {
        label: 'Label',
        icon: 'pencil',
        items: (['None', 'Draft', 'Final'] as const).map((label) => ({ label, checked: row.label === label, onSelect: () => change(row.id, { label }) }))
    },
    { separator: true },
    ...items,
    { separator: true },
    { label: 'Move to trash', icon: 'trash', onSelect: () => ((docs.value = docs.value.filter((doc) => doc.id !== row.id)), (said.value = `${row.name} moved to the trash`)) }
];

const { config } = useVitral();
const size = computed(() => (value: unknown) => new Intl.NumberFormat(config.locale.code, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }).format((value as number) / 1_000_000));
const day = computed(() => (value: unknown) => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }).format(value as Date));
const star = (value: unknown) => (value ? 'Starred' : '');
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <DataGrid :value="docs" data-key="id" aria-label="Documents" navigation="cell" :context-menu="menu" style="width: 100%">
            <Column field="name" header="Name" sortable />
            <Column field="owner" header="Owner" sortable />
            <Column field="label" header="Label" />
            <Column field="starred" header="Star" :value-formatter="star" />
            <Column field="size" header="Size" align="right" sortable :value-formatter="size" />
            <Column field="modified" header="Modified" align="right" sortable :value-formatter="day" />
        </DataGrid>
        <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ said }}</small>
    </div>
</template>
