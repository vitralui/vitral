<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { computed, provide } from 'vue';
import { categoryName } from '../demo';
import { entries, entryOf, entryText, sectionText } from '../lib/catalog';
import { T, t } from '../lib/i18n';
import { apiOf, memberDoc } from '../lib/api';
import { route, href } from '../lib/router';
import { demoSourcesKey, slugify } from '../lib/section';
import { sectionSources } from '../lib/source';
import CodeBlock from '../parts/CodeBlock.vue';
import Toc from '../parts/Toc.vue';

const entry = computed(() => entryOf(route.value.id) ?? entries[0]!);
const sources = computed(() => sectionSources(entry.value.file));
const api = computed(() => apiOf(entry.value.file));

// A section's markup is looked up by its title, so the map has to be the one
// for the page being shown, so it is replaced whenever the route changes.
provide(demoSourcesKey, sources);

const importSnippet = computed(() => `import { ${entry.value.file} } from '@vitral/vue';`);

const index = computed(() => entries.findIndex((item) => item.id === entry.value.id));
const previous = computed(() => entries[index.value - 1]);
const next = computed(() => entries[index.value + 1]);

const text = computed(() => entryText(entry.value));

const toc = computed(() => [
    { id: 'import', label: t('Import') },
    ...[...sources.value.keys()].map((title) => ({ id: slugify(title), label: sectionText(entry.value, title).title })),
    ...(api.value?.props.length ? [{ id: 'api', label: 'API' }] : [])
]);
</script>

<template>
    <div class="doc-main">
        <div class="doc-head">
            <span class="eyebrow">{{ categoryName(entry.meta.category) }}</span>
            <h1>{{ text.title }}</h1>
            <p v-if="text.description">{{ text.description }}</p>
            <div class="doc-head-links">
                <Tag :value="t('WAI-ARIA tested')" severity="success" />
            </div>
        </div>

        <h2 id="import" class="prose" style="margin: 0; font-size: 1.375rem; font-weight: 600; scroll-margin-top: 4.5rem">{{ t('Import') }}</h2>
        <CodeBlock :code="importSnippet" label="main.ts" lang="ts" />

        <component :is="entry.component" :key="entry.id" />

        <template v-if="api">
            <h2 id="api" class="prose" style="margin: 2.5rem 0 0.5rem; font-size: 1.375rem; font-weight: 600; scroll-margin-top: 4.5rem">API</h2>
            <p style="margin: 0 0 1rem; font-size: 0.875rem; color: var(--vt-text-muted-color)">
                {{ t('Read from') }} <code>{{ `packages/vue/src/components/${entry.file}/types.ts` }}</code
                >{{ t(', so it says what the component actually accepts.') }}
            </p>

            <template v-if="api.props.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Props</h3>
                <div class="api-scroll"><table class="api-table">
                    <thead>
                        <tr>
                            <th>{{ t('Name') }}</th>
                            <th>{{ t('Type') }}</th>
                            <th>{{ t('Description') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="prop in api.props" :key="prop.name">
                            <td>{{ prop.name }}{{ prop.optional ? '' : ' *' }}</td>
                            <td class="type">{{ prop.type }}</td>
                            <td class="doc">{{ memberDoc(entry.file, 'props', prop) ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table></div>
                <T v-if="api.extends.includes('BaseProps')" k="prose.baseProps" style="margin: -0.75rem 0 1.5rem; font-size: 0.8125rem; color: var(--vt-text-muted-color)">
                    Plus <code>pt</code>, <code>dt</code> and <code>unstyled</code> from <code>BaseProps</code>, see
                    <a :href="href('/docs/pass-through')">pass-through</a> and <a :href="href('/docs/unstyled')">unstyled mode</a>.
                </T>
            </template>

            <template v-if="api.emits.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Emits</h3>
                <div class="api-scroll"><table class="api-table">
                    <thead>
                        <tr>
                            <th>{{ t('Event') }}</th>
                            <th>Payload</th>
                            <th>{{ t('Description') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="event in api.emits" :key="event.name">
                            <td>{{ event.name }}</td>
                            <td class="type">{{ event.type }}</td>
                            <td class="doc">{{ memberDoc(entry.file, 'emits', event) ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table></div>
            </template>

            <template v-if="api.slots.length">
                <h3 style="margin: 1.25rem 0 0; font-size: 1rem">Slots</h3>
                <div class="api-scroll"><table class="api-table">
                    <thead>
                        <tr>
                            <th>{{ t('Name') }}</th>
                            <th>{{ t('Slot props') }}</th>
                            <th>{{ t('Description') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="slot in api.slots" :key="slot.name">
                            <td>{{ slot.name }}</td>
                            <td class="type">{{ slot.type }}</td>
                            <td class="doc">{{ memberDoc(entry.file, 'slots', slot) ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table></div>
            </template>
        </template>

        <nav class="pager" :aria-label="t('Components')">
            <a v-if="previous" :href="href(`/components/${previous.id}`)"><span>{{ t('Previous') }}</span>{{ entryText(previous).title }}</a>
            <a v-if="next" class="next" :href="href(`/components/${next.id}`)"><span>{{ t('Next') }}</span>{{ entryText(next).title }}</a>
        </nav>
    </div>

    <Toc :items="toc" />
</template>
