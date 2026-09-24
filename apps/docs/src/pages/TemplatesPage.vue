<script setup lang="ts">
import { href } from '../lib/router';
import { Button, Icon, SelectButton, Tag } from '@vitral/vue';
import { computed, ref } from 'vue';
import TemplateThumb from '../parts/TemplateThumb.vue';
import { t } from '../lib/i18n';
import { templateCategories, templates, templateText } from '../templates';

// The gallery: every template as a card with its first screen running in it,
// and one filter across the top.
const category = ref('All');
const filters = computed(() => [
    { label: `${t('All')} (${templates.length})`, value: 'All' },
    ...templateCategories.map((group) => ({ label: `${t(group.category)} (${group.items.length})`, value: group.category }))
]);
const shown = computed(() => (category.value === 'All' ? templates : templates.filter((entry) => entry.category === category.value)));
</script>

<template>
    <main class="home tpl-gallery-page">
        <section class="home-hero tpl-hero" aria-labelledby="templates-title">
            <div class="home-wrap">
                <span class="tpl-eyebrow">Templates</span>
                <h1 id="templates-title">{{ t('Applications to start from') }}</h1>
                <p class="home-lead">
                    {{
                        t(
                            '{count} multi-screen applications built only from Vitral components: a store, a newsroom, dashboards, a booking flow. Each one is responsive, follows whichever theme you pick, and its source is one click away.',
                            { count: templates.length }
                        )
                    }}
                </p>
            </div>
        </section>

        <section class="home-band tpl-gallery-band" :aria-label="t('All templates')">
            <div class="home-wrap">
                <div class="tpl-filter">
                    <SelectButton v-model="category" :options="filters" option-label="label" option-value="value" :allow-empty="false" :label="t('Category')" size="small" />
                </div>

                <ul class="tpl-grid">
                    <li v-for="entry in shown" :key="entry.id">
                        <article class="tpl-card">
                            <a :href="href(`/templates/${entry.id}`)" class="tpl-card-media" :aria-label="`${entry.name} — ${t('{category} template', { category: templateText(entry).category })}`">
                                <TemplateThumb :template="entry" />
                            </a>
                            <div class="tpl-card-body">
                                <span class="tpl-card-kicker"><Icon :icon="entry.icon" /> {{ templateText(entry).category }} · {{ t('{count} screens', { count: entry.screens.length }) }}</span>
                                <h2>
                                    <a :href="href(`/templates/${entry.id}`)">{{ entry.name }}</a>
                                </h2>
                                <p>{{ templateText(entry).summary }}</p>
                                <div class="tpl-tags">
                                    <Tag v-for="tag in templateText(entry).tags" :key="tag" :value="tag" severity="secondary" />
                                </div>
                            </div>
                            <div class="tpl-card-foot">
                                <Button
                                    as="a"
                                    :href="href(`/templates/${entry.id}`)"
                                    :label="t('Details')"
                                    size="small"
                                    variant="outlined"
                                    severity="secondary"
                                    :aria-label="t('{name} details', { name: entry.name })"
                                />
                                <Button
                                    as="a"
                                    :href="href(`/templates/${entry.id}/preview`)"
                                    :label="t('Live preview')"
                                    icon="externalLink"
                                    icon-pos="right"
                                    size="small"
                                    variant="text"
                                    :aria-label="t('Open {name} full screen', { name: entry.name })"
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
                        <h2 id="templates-own">{{ t('Make one your own') }}</h2>
                        <p>{{ t('A template is a folder of Vue files over the same tokens as everything else, so changing the preset changes it too.') }}</p>
                    </div>
                    <div class="home-actions">
                        <Button as="a" :href="href('/docs/presets')" :label="t('Read about presets')" />
                        <Button as="a" :href="href('/components')" :label="t('Browse components')" severity="secondary" variant="outlined" />
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
