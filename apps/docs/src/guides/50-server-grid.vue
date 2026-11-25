<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'A grid fed by your server',
    section: 'Recipes',
    description: 'A DataGrid over a table too big to send whole: the grid asks for one page with its sort and its search, your endpoint answers with the rows and a count.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';
import ServerGrid from './recipes/ServerGrid.vue';

const loader = `import { createDataSource, type LoadOptions } from '@vitral/vue';

export const orders = createDataSource<Order>({
    load: async (options: LoadOptions) => {
        const query = new URLSearchParams({
            offset: String(options.first ?? 0),
            limit: String(options.rows ?? 20)
        });
        // [{ field: 'total', order: -1 }] → sort=-total
        for (const { field, order } of options.sort ?? []) query.append('sort', \`\${order === -1 ? '-' : ''}\${field}\`);
        if (options.globalFilter?.value) query.set('q', String(options.globalFilter.value));

        const response = await fetch(\`/api/orders?\${query}\`);
        // Whatever your endpoint calls them: the page, and how many rows match in all.
        const { rows, count } = await response.json();
        return { items: rows, total: count };
    }
});`;

const grid = `<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';
import { ref } from 'vue';
import { orders } from './orders';

const filters = ref({ global: { value: null, matchMode: 'contains' } });
<\/script>

<template>
    <DataGrid
        v-model:filters="filters"
        :data-source="orders"
        :global-filter-fields="['customer', 'city']"
        :filter-delay="300"
        loading-mode="skeleton"
        paginator
        :rows="20"
        data-key="id"
    >
        <Column field="id" header="Order" sortable />
        <Column field="customer" header="Customer" sortable />
        <Column field="total" header="Total" sortable align="right" />
    </DataGrid>
</template>`;

const endpoint = `// Express and Postgres here; any server and any database read the same four things.
const SORTABLE = new Set(['id', 'customer', 'city', 'status', 'total']);

app.get('/api/orders', async (req, res) => {
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    // Only names you know become SQL; everything else is a parameter.
    const order = [req.query.sort ?? []].flat()
        .map((key) => ({ field: key.replace(/^-/, ''), desc: key.startsWith('-') }))
        .filter(({ field }) => SORTABLE.has(field))
        .map(({ field, desc }) => \`\${field} \${desc ? 'DESC' : 'ASC'}\`);
    const where = req.query.q ? 'WHERE customer ILIKE $1 OR city ILIKE $1' : '';
    const params = req.query.q ? [\`%\${req.query.q}%\`] : [];

    const [{ rows }, { rows: [{ count }] }] = await Promise.all([
        db.query(\`SELECT * FROM orders \${where} ORDER BY \${order.join(', ') || 'id'} LIMIT \${limit} OFFSET \${offset}\`, params),
        db.query(\`SELECT count(*)::int AS count FROM orders \${where}\`, params)
    ]);
    res.json({ rows, count });
});`;

const reload = `<script setup lang="ts">
const grid = ref<InstanceType<typeof DataGrid> | null>(null);

async function save(order: Order) {
    await fetch(\`/api/orders/\${order.id}\`, { method: 'PUT', body: JSON.stringify(order) });
    // The same page, sort and search, asked again.
    grid.value?.reload();
}
<\/script>

<template>
    <DataGrid ref="grid" :data-source="orders" paginator :rows="20">…</DataGrid>
</template>`;
</script>

<template>
    <T k="intro">
        Sixty thousand orders do not go to the browser. The grid asks for the page it is showing, sorted and searched the way the reader has it, and your endpoint answers
        with those rows and how many match in all, which is what the paginator counts. Sort a column, type in the search or turn the page below, and watch what it asks.
    </T>

    <div class="recipe-live">
        <ServerGrid />
    </div>

    <T k="loader.title" as="h2">The loader</T>
    <T k="loader.body" as="p">
        <code>createDataSource({ load })</code> is called with the grid's state every time it changes: <code>first</code> and <code>rows</code> for the page, <code>sort</code>
        as a list of fields and directions, <code>filters</code> by column and <code>globalFilter</code> for the search. It answers with <code>{ items, total }</code>. An
        answer that arrives after a newer question has been asked is thrown away, so a slow page never overwrites a fast one.
    </T>
    <CodeBlock :code="loader" label="orders.ts" lang="ts" />

    <T k="grid.title" as="h2">The grid</T>
    <T k="grid.body" as="p">
        The grid is the one you would write over an array, with <code>data-source</code> in place of <code>value</code>. <code>filter-delay</code> waits for the reader to stop
        typing before it asks, and <code>loading-mode="skeleton"</code> keeps the table's shape while a page is on its way, rather than covering it.
    </T>
    <CodeBlock :code="grid" label="Orders.vue" lang="vue" />

    <T k="endpoint.title" as="h2">The endpoint</T>
    <T k="endpoint.body" as="p">
        Two queries: the page, and the count with the same conditions and no limit. The sort comes from the address, so only the names of columns you allow are written into
        the SQL; the search goes in as a parameter.
    </T>
    <CodeBlock :code="endpoint" label="server.ts" lang="ts" />

    <T k="edit.title" as="h2">After an edit</T>
    <T k="edit.body" as="p">
        When a row changes on the server, <code>reload()</code> asks for the same page again, with the sort and the search the reader left. The
        <a :href="href('/components/datagrid#from-a-data-source')">data source example</a> has the rest of the grid around it.
    </T>
    <CodeBlock :code="reload" label="Orders.vue" lang="vue" />
</template>
