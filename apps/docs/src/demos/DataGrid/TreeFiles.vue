<script setup lang="ts">
import { fileCode, fileText, folder as folderIcon, image } from '@vitral/icons';
import { Column, DataGrid, Icon, InputText, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Entry {
    path: string;
    name: string;
    kind: 'folder' | 'code' | 'text' | 'image';
    size: number;
    modified: Date;
    children?: Entry[];
}

const day = (month: number, date: number) => new Date(2026, month, date);
const file = (parent: string, name: string, kind: Entry['kind'], size: number, modified: Date): Entry => ({ path: `${parent}/${name}`, name, kind, size, modified });
const folder = (parent: string, name: string, children: (path: string) => Entry[]): Entry => {
    const path = `${parent}/${name}`;
    const inside = children(path);
    return {
        path,
        name,
        kind: 'folder',
        children: inside,
        size: inside.reduce((sum, entry) => sum + entry.size, 0),
        modified: new Date(Math.max(...inside.map((entry) => entry.modified.getTime())))
    };
};

const tree = ref<Entry[]>([
    folder('', 'src', (src) => [
        folder(src, 'components', (dir) => [
            file(dir, 'Button.vue', 'code', 6_210, day(9, 2)),
            file(dir, 'DataGrid.vue', 'code', 48_930, day(10, 20)),
            file(dir, 'Dialog.vue', 'code', 12_480, day(8, 14))
        ]),
        folder(src, 'assets', (dir) => [file(dir, 'logo.svg', 'image', 3_120, day(2, 5)), file(dir, 'hero.png', 'image', 284_000, day(5, 30))]),
        file(src, 'main.ts', 'code', 1_204, day(10, 18)),
        file(src, 'router.ts', 'code', 3_876, day(7, 9))
    ]),
    folder('', 'docs', (docs) => [file(docs, 'getting-started.md', 'text', 9_640, day(10, 1)), file(docs, 'theming.md', 'text', 14_220, day(9, 22))]),
    file('', 'package.json', 'code', 2_048, day(10, 21)),
    file('', 'README.md', 'text', 5_330, day(6, 12))
]);

const search = ref('');
const filters = computed(() => ({ global: { value: search.value, matchMode: 'contains' } }));
const icons = { folder: folderIcon, code: fileCode, text: fileText, image } as const;

const { config } = useVitral();
const day_ = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
const bytes = (size: number) => (size < 1024 ? `${size} B` : size < 1024 ** 2 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 ** 2).toFixed(1)} MB`);
const open = ref<string[]>(['/src']);
</script>

<template>
    <DataGrid
        v-model:expanded-tree="open"
        :value="tree"
        data-key="path"
        tree-data="children"
        aria-label="Files"
        :filters="filters"
        :global-filter-fields="['name']"
        class="demo-table"
    >
        <template #header>
            <div class="demo-table-bar">
                <strong>Project files</strong>
                <InputText v-model="search" size="small" placeholder="Find a file" aria-label="Find a file" class="demo-end" />
            </div>
        </template>
        <Column field="name" header="Name" sortable>
            <template #body="{ data }">
                <span class="demo-name"><Icon :icon="icons[(data as Entry).kind]" class="demo-icon" />{{ data.name }}</span>
            </template>
        </Column>
        <Column field="size" header="Size" sortable align="right">
            <template #body="{ data }">{{ bytes(data.size) }}</template>
        </Column>
        <Column field="modified" header="Modified" sortable>
            <template #body="{ data }">{{ day_.format(data.modified) }}</template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.demo-end {
    margin-inline-start: auto;
}

.demo-name {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.demo-icon {
    color: var(--vt-text-muted-color);
}
</style>
