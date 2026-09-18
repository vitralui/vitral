<script setup lang="ts">
import { Button, Icon, SelectButton, Tag } from '@vitral/vue';
import { computed, ref } from 'vue';
import TemplateThumb from '../parts/TemplateThumb.vue';
import { templateCategories, templates } from '../templates';

// The gallery: every template as a card with its first screen running in it,
// and one filter across the top.
const category = ref('All');
const filters = computed(() => [
    { label: `All (${templates.length})`, value: 'All' },
    ...templateCategories.map((group) => ({ label: `${group.category} (${group.items.length})`, value: group.category }))
]);
const shown = computed(() => (category.value === 'All' ? templates : templates.filter((entry) => entry.category === category.value)));
</script>

<template>
    <main class="home tpl-gallery-page">
        <section class="home-hero tpl-hero" aria-labelledby="templates-title">
            <div class="home-wrap">
                <span class="tpl-eyebrow">Templates</span>
                <h1 id="templates-title">Applications to start from</h1>
                <p class="home-lead">
                    {{ templates.length }} multi-screen applications built only from Vitral components — a store, a newsroom, dashboards, a booking flow. Each one is responsive,
                    follows whichever theme you pick, and its source is one click away.
                </p>
            </div>
        </section>

        <section class="home-band tpl-gallery-band" aria-label="All templates">
            <div class="home-wrap">
                <div class="tpl-filter">
                    <SelectButton v-model="category" :options="filters" option-label="label" option-value="value" :allow-empty="false" label="Category" size="small" />
                </div>

                <ul class="tpl-grid">
                    <li v-for="entry in shown" :key="entry.id">
                        <article class="tpl-card">
                            <a :href="`#/templates/${entry.id}`" class="tpl-card-media" :aria-label="`${entry.name} — ${entry.category} template`">
                                <TemplateThumb :template="entry" />
                            </a>
                            <div class="tpl-card-body">
                                <span class="tpl-card-kicker"><Icon :icon="entry.icon" /> {{ entry.category }} · {{ entry.screens.length }} screens</span>
                                <h2>
                                    <a :href="`#/templates/${entry.id}`">{{ entry.name }}</a>
                                </h2>
                                <p>{{ entry.summary }}</p>
                                <div class="tpl-tags">
                                    <Tag v-for="tag in entry.tags" :key="tag" :value="tag" severity="secondary" />
                                </div>
                            </div>
                            <div class="tpl-card-foot">
                                <Button
                                    as="a"
                                    :href="`#/templates/${entry.id}`"
                                    label="Details"
                                    size="small"
                                    variant="outlined"
                                    severity="secondary"
                                    :aria-label="`${entry.name} details`"
                                />
                                <Button
                                    as="a"
                                    :href="`#/templates/${entry.id}/preview`"
                                    label="Live preview"
                                    icon="externalLink"
                                    icon-pos="right"
                                    size="small"
                                    variant="text"
                                    :aria-label="`Open ${entry.name} full screen`"
                                />
                            </div>
                        </article>
                    </li>
                </ul>
            </div>
        </section>

        <section class="home-band" aria-labelledby="templates-own">
            <div class="home-wrap">
                <div class="home-end">
                    <div>
                        <h2 id="templates-own">Make one your own</h2>
                        <p>A template is a folder of Vue files over the same tokens as everything else — change the preset and it changes with it.</p>
                    </div>
                    <div class="home-actions">
                        <Button as="a" href="#/docs/presets" label="Read about presets" />
                        <Button as="a" href="#/components/button" label="Browse components" severity="secondary" variant="outlined" />
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
