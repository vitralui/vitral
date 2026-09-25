<script setup lang="ts">
import { Button } from '@vitral/vue';
import { computed } from 'vue';
import { entries, entryText, type CatalogEntry } from '../lib/catalog';
import { t } from '../lib/i18n';
import { installCommand } from '../lib/install';
import { REPO_URL } from '../lib/links';
import { href } from '../lib/router';
import { templates, templateText } from '../templates';
import CodeBlock from './CodeBlock.vue';

/**
 * Where a page ends: somewhere to go next, and a way to start. A reader who
 * reached the bottom of the DataGrid wants the components that are built with
 * it, not the next one in the alphabet, which is all the pager knows; and one
 * who is convinced should not have to find the installation guide.
 *
 * The related components are the rest of its category, the ones the templates
 * put beside this one first: that is the nearest thing to "used together"
 * there is. A component every template uses (a Button) says little by being
 * beside this one, so being beside it counts for less the more common it is.
 */
const props = defineProps<{ entry?: CatalogEntry; install?: boolean }>();

const MOST = 4;

const usedIn = computed(() => (props.entry ? templates.filter((template) => template.components.includes(props.entry!.meta.title)) : []));

const related = computed(() => {
    const entry = props.entry;
    if (!entry) return [];
    const uses = (name: string) => templates.filter((template) => template.components.includes(name)).length;
    const score = new Map<CatalogEntry, number>();
    for (const other of entries) {
        if (other !== entry && other.meta.category === entry.meta.category) score.set(other, 1);
    }
    for (const template of usedIn.value) {
        for (const name of template.components) {
            const other = entries.find((item) => item.meta.title === name);
            if (other && other !== entry) score.set(other, (score.get(other) ?? 0) + 1 / uses(name));
        }
    }
    return [...score.entries()]
        .sort(([a, x], [b, y]) => y - x || a.meta.title.localeCompare(b.meta.title))
        .slice(0, MOST)
        .map(([item]) => item);
});

// In the package manager the reader picked on the home page.
const command = computed(() => installCommand());
</script>

<template>
    <section v-if="related.length" class="page-end-related" aria-labelledby="related">
        <h2 id="related">{{ t('Related components') }}</h2>
        <ul>
            <li v-for="item in related" :key="item.id">
                <a class="components-card" :href="href(`/components/${item.id}`)">
                    <strong>{{ entryText(item).title }}</strong>
                    <span v-if="entryText(item).description">{{ entryText(item).description }}</span>
                </a>
            </li>
        </ul>
        <template v-if="usedIn.length">
            <h3>{{ t('Used in these templates') }}</h3>
            <ul class="tpl-components">
                <li v-for="template in usedIn" :key="template.id">
                    <a :href="href(`/templates/${template.id}`)">{{ template.name }} · {{ templateText(template).category }}</a>
                </li>
            </ul>
        </template>
    </section>

    <aside v-if="install" class="page-end-start" :aria-label="t('Start with one package')">
        <div>
            <h2>{{ t('Start with one package') }}</h2>
            <p>{{ t('Free and open source. One package, one plugin call, and every component is themed.') }}</p>
        </div>
        <CodeBlock :code="command" label="terminal" lang="bash" />
        <div class="page-end-actions">
            <Button as="a" :href="href('/docs/installation')" :label="t('Read the installation guide')" />
            <Button as="a" :href="REPO_URL" target="_blank" rel="noreferrer" icon="star" :label="t('Star on GitHub')" severity="secondary" variant="outlined" />
        </div>
    </aside>
</template>
