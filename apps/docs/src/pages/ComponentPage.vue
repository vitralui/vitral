<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { computed, provide } from 'vue';
import { entries, entryOf } from '../lib/catalog';
import { apiOf } from '../lib/api';
import { route } from '../lib/router';
import { demoSourcesKey, slugify } from '../lib/section';
import { sectionSources, setupSource } from '../lib/source';
import CodeBlock from '../parts/CodeBlock.vue';
import Toc from '../parts/Toc.vue';

const entry = computed(() => entryOf(route.value.id) ?? entries[0]!);
const sources = computed(() => sectionSources(entry.value.file));
const setup = computed(() => setupSource(entry.value.file));
const api = computed(() => apiOf(entry.value.file));

// A section's markup is looked up by its title, so the map has to be the one
// for the page being shown — it is replaced whenever the route changes.
provide(demoSourcesKey, sources);

const importSnippet = computed(() => `import { ${entry.value.file} } from '@vitral/vue';`);

const index = computed(() => entries.findIndex((item) => item.id === entry.value.id));
const previous = computed(() => entries[index.value - 1]);
const next = computed(() => entries[index.value + 1]);

const toc = computed(() => [
    { id: 'import', label: 'Import' },
    ...[...sources.value.keys()].map((title) => ({ id: slugify(title), label: title })),
    ...(api.value?.props.length ? [{ id: 'api', label: 'API' }] : [])
]);
</script>

<template>
    <div class="doc-main">
        <div class="doc-head">
            <span class="eyebrow">{{ entry.meta.category }}</span>
            <h1>{{ entry.meta.title }}</h1>
            <p v-if="entry.meta.description">{{ entry.meta.description }}</p>
            <div class="doc-head-links">
                <Tag value="WAI-ARIA tested" severity="success" />
            </div>
        </div>

        <h2 id="import" class="prose" style="margin: 0; font-size: 1.375rem; font-weight: 600; scroll-margin-top: 4.5rem">Import</h2>
        <CodeBlock :code="importSnippet" label="main.ts" lang="ts" />
        <details v-if="setup" style="margin: -0.5rem 0 1.5rem">
            <summary style="cursor: pointer; font-size: 0.8125rem; color: var(--vt-text-muted-color)">The script behind the examples on this page</summary>
            <CodeBlock :code="setup" label="script setup" lang="ts" />
        </details>

        <component :is="entry.component" :key="entry.id" />

        <template v-if="api">
            <h2 id="api" class="prose" style="margin: 2.5rem 0 0.5rem; font-size: 1.375rem; font-weight: 600; scroll-margin-top: 4.5rem">API</h2>
            <p style="margin: 0 0 1rem; font-size: 0.875rem; color: var(--vt-text-muted-color)">
                Read from <code>{{ `packages/vue/src/components/${entry.file}/types.ts` }}</code
                >, so it says what the component actually accepts.
            </p>

            <template v-if="api.props.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Props</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="prop in api.props" :key="prop.name">
                            <td>{{ prop.name }}{{ prop.optional ? '' : ' *' }}</td>
                            <td class="type">{{ prop.type }}</td>
                            <td class="doc">{{ prop.doc ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table>
                <p v-if="api.extends.includes('BaseProps')" style="margin: -0.75rem 0 1.5rem; font-size: 0.8125rem; color: var(--vt-text-muted-color)">
                    Plus <code>pt</code>, <code>dt</code> and <code>unstyled</code> from <code>BaseProps</code> — see
                    <a href="#/docs/pass-through">pass-through</a> and <a href="#/docs/unstyled">unstyled mode</a>.
                </p>
            </template>

            <template v-if="api.emits.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Emits</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Payload</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="event in api.emits" :key="event.name">
                            <td>{{ event.name }}</td>
                            <td class="type">{{ event.type }}</td>
                            <td class="doc">{{ event.doc ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </template>

            <template v-if="api.slots.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Slots</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Slot props</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="slot in api.slots" :key="slot.name">
                            <td>{{ slot.name }}</td>
                            <td class="type">{{ slot.type }}</td>
                            <td class="doc">{{ slot.doc ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </template>
        </template>

        <nav class="pager" aria-label="Components">
            <a v-if="previous" :href="`#/components/${previous.id}`"><span>Previous</span>{{ previous.meta.title }}</a>
            <a v-if="next" class="next" :href="`#/components/${next.id}`"><span>Next</span>{{ next.meta.title }}</a>
        </nav>
    </div>

    <Toc :items="toc" />
</template>
