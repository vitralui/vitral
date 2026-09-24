<script setup lang="ts">
import { Button, Chart, Icon } from '@vitral/vue';
import { computed, provide, ref } from 'vue';
import { chartEntries, chartText, families, snippetOf, type ChartEntry, type Family } from '../lib/charts';
import { proseScope, T, t } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

/**
 * Every kind of chart the engine draws, on one page, so choosing one is a
 * matter of looking rather than of reading a list of names. Each card is the
 * live chart, what it is for, and the two objects behind it.
 */

// The page's prose reads its translations from `locales/<lang>/charts.json`.
provide(proseScope, { value: 'charts' });

const family = ref<Family | 'all'>('all');
const open = ref<string | null>(null);

const shown = computed(() => (family.value === 'all' ? chartEntries : chartEntries.filter((entry) => entry.family === family.value)));
const groups = computed(() => families.map((name) => ({ name, items: shown.value.filter((entry) => entry.family === name) })).filter((group) => group.items.length > 0));

const usage = (entry: ChartEntry) => `<Chart type="${entry.kind}" :series="series" :options="options" :height="260" />`;
const countOf = (name: Family) => chartEntries.filter((entry) => entry.family === name).length;
</script>

<template>
    <main class="charts-page">
        <div class="doc-head">
            <span class="eyebrow">{{ t('Charts') }}</span>
            <h1>{{ t('{count} charts, drawn without a dependency', { count: chartEntries.length }) }}</h1>
            <T k="lead">
                One SVG engine, no plotting library underneath, driven by the options object ApexCharts made familiar. Everything visual is plain data, so it survives
                <code>JSON</code> and a settings screen can write it. Each chart is named by a summary generated from its own data, and its plot takes focus: the arrow keys
                read it point by point.
            </T>
            <p class="charts-head-links">
                <a :href="href('/components/chart')">{{ t('The Chart component, in full') }} <Icon icon="arrowRight" /></a>
            </p>
        </div>

        <div class="charts-filter" role="group" :aria-label="t('Filter by what the chart is for')">
            <button type="button" :class="{ on: family === 'all' }" :aria-pressed="family === 'all'" @click="family = 'all'">
                {{ t('All') }} <small>{{ chartEntries.length }}</small>
            </button>
            <button v-for="name in families" :key="name" type="button" :class="{ on: family === name }" :aria-pressed="family === name" @click="family = name">
                {{ t(name) }} <small>{{ countOf(name) }}</small>
            </button>
        </div>

        <section v-for="group in groups" :key="group.name" class="charts-group" :aria-labelledby="`charts-${group.name.replace(/\s/g, '-')}`">
            <h2 :id="`charts-${group.name.replace(/\s/g, '-')}`">{{ t(group.name) }}</h2>
            <div class="charts-grid">
                <article v-for="entry in group.items" :key="entry.id" class="charts-card" :aria-labelledby="`chart-${entry.id}`">
                    <header>
                        <h3 :id="`chart-${entry.id}`">{{ chartText(entry).name }}</h3>
                        <code>type="{{ entry.kind }}"</code>
                    </header>
                    <div class="charts-plot">
                        <Chart :type="entry.kind" :series="entry.series" :options="entry.options" :height="240" />
                    </div>
                    <p>{{ chartText(entry).note }}</p>
                    <Button
                        :label="open === entry.id ? t('Hide the code') : t('Show the code')"
                        :icon="open === entry.id ? 'chevronUp' : 'chevronDown'"
                        severity="secondary"
                        variant="text"
                        size="small"
                        :aria-expanded="open === entry.id"
                        :aria-controls="`chart-code-${entry.id}`"
                        @click="open = open === entry.id ? null : entry.id"
                    />
                    <div v-show="open === entry.id" :id="`chart-code-${entry.id}`" class="charts-code">
                        <CodeBlock :code="usage(entry)" label="template" lang="vue" />
                        <CodeBlock :code="snippetOf(entry)" label="script" lang="ts" />
                    </div>
                </article>
            </div>
        </section>

        <section class="charts-more" aria-labelledby="charts-more">
            <h2 id="charts-more">{{ t('Beyond the shapes') }}</h2>
            <ul>
                <li><Icon icon="search" /> <T k="more.zoom" as="span"><b>Zoom and brush.</b> Drag on the plot to zoom, or pair a chart with a brush chart that selects the window.</T></li>
                <li><Icon icon="grip" /> <T k="more.synced" as="span"><b>Synced groups.</b> Charts sharing a <code>group</code> move their tooltip and their window together.</T></li>
                <li><Icon icon="sliders" /> <T k="more.tokens" as="span"><b>Themed by tokens.</b> Colours, grid and type come from the same tokens as the components, light and dark.</T></li>
                <li><Icon icon="terminal" /> <T k="more.vue" as="span"><b>Without Vue.</b> <code>@vitral/chart</code> mounts into any element; the Vue component is a wrapper over it.</T></li>
            </ul>
            <p><a :href="href('/components/chart')">{{ t('All of it is on the Chart page') }} <Icon icon="arrowRight" /></a></p>
        </section>
    </main>
</template>
