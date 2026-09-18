<script setup lang="ts">
import { externalLink } from '@vitral/icons';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, Breadcrumb, Button, Icon, Tag, useTheme } from '@vitral/vue';
import { computed, ref, watch } from 'vue';
import { entries } from '../lib/catalog';
import { repoPath } from '../lib/links';
import { route } from '../lib/router';
import { SHOT_WIDTH, shotOf } from '../lib/shots';
import { templateOf, templates } from '../templates';

// A template's page shows it in pictures: every screen, whole, one under the
// other, in the site's scheme. It runs only on request, full screen,
// where it is an application of its own rather than a page inside a page.
const theme = useTheme();

const entry = computed(() => templateOf(route.value.id));
const index = computed(() => templates.findIndex((item) => item.id === entry.value?.id));
const previous = computed(() => templates[(index.value - 1 + templates.length) % templates.length]!);
const next = computed(() => templates[(index.value + 1) % templates.length]!);

const faq = ref<string | null>('0');

watch(
    entry,
    (current) => {
        if (!current) return;
        faq.value = '0';
    },
    { immediate: true }
);

const shots = computed(() =>
    (entry.value?.screens ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        summary: item.summary,
        src: shotOf(entry.value!.id, item.id, theme.isDark.value),
        alt: `${entry.value!.name}: the ${item.name} screen`
    }))
);

const demoOf = (screen?: string) => `#/templates/${entry.value?.id}/preview${screen ? `/${screen}` : ''}`;
const sourceUrl = computed(() => repoPath(`apps/docs/src/templates/${entry.value?.id}`));

// Each component the template uses, linked to its page when the catalog has one.
const used = computed(() =>
    (entry.value?.components ?? []).map((name) => ({ name, id: entries.find((item) => item.meta.title === name)?.id })).sort((a, b) => a.name.localeCompare(b.name))
);

const trail = computed(() => [{ label: 'Templates', url: '#/templates' }, { label: entry.value?.category ?? '' }]);

function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

const shotId = (screen: string) => `screen-${screen}`;
</script>

<template>
    <main v-if="entry" class="home tpl-detail">
        <section class="home-hero tpl-hero" aria-labelledby="template-title">
            <div class="home-wrap tpl-hero-row">
                <div class="tpl-hero-copy">
                    <Breadcrumb :model="trail" aria-label="Breadcrumb" class="tpl-crumbs" />
                    <h1 id="template-title">
                        <span class="tpl-hero-icon"><Icon :icon="entry.icon" /></span>
                        {{ entry.name }}
                    </h1>
                    <p class="home-lead">{{ entry.description }}</p>
                    <div class="tpl-tags">
                        <Tag v-for="tag in entry.tags" :key="tag" :value="tag" severity="secondary" />
                    </div>
                </div>
                <div class="home-actions tpl-hero-actions">
                    <Button as="a" :href="demoOf()" label="Live demo" icon="play" />
                    <Button as="a" :href="sourceUrl" target="_blank" rel="noreferrer" label="Source on GitHub" :icon="externalLink" icon-pos="right" severity="secondary" variant="outlined" />
                </div>
            </div>
        </section>

        <section id="template-screens" class="tpl-shots-band" aria-labelledby="template-screens-title">
            <div class="home-wrap">
                <h2 id="template-screens-title" class="vt-sr-only">Screens</h2>
                <ol class="tpl-shots">
                    <li v-for="(shot, i) in shots" :id="shotId(shot.id)" :key="shot.id" class="tpl-shot-item">
                        <header class="tpl-shot-head">
                            <span class="tpl-screen-num">{{ i + 1 }}</span>
                            <div>
                                <h3>{{ shot.name }}</h3>
                                <p>{{ shot.summary }}</p>
                            </div>
                            <Button as="a" :href="demoOf(shot.id)" label="Open live" icon="play" size="small" severity="secondary" variant="outlined" :aria-label="`Open the ${shot.name} screen live`" />
                        </header>
                        <a :href="demoOf(shot.id)" class="tpl-shot-frame" :aria-label="`Open the ${shot.name} screen live`">
                            <img class="tpl-shot" :src="shot.src" :alt="shot.alt" :width="SHOT_WIDTH" loading="lazy" decoding="async" />
                        </a>
                    </li>
                </ol>
            </div>
        </section>

        <section class="home-band" aria-labelledby="template-inside">
            <div class="home-wrap">
                <header class="home-head">
                    <h2 id="template-inside">What's inside</h2>
                    <p>{{ entry.screens.length }} screens and {{ entry.components.length }} components, wired together with shared state and local navigation.</p>
                </header>
                <div class="tpl-inside">
                    <div>
                        <h3>Features</h3>
                        <ul class="tpl-checks">
                            <li v-for="feature in entry.features" :key="feature"><Icon icon="check" /> {{ feature }}</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Screens</h3>
                        <ul class="tpl-screen-list">
                            <li v-for="(item, i) in entry.screens" :key="item.id">
                                <button type="button" @click="scrollTo(shotId(item.id))">
                                    <span class="tpl-screen-num">{{ i + 1 }}</span>
                                    <span>
                                        <b>{{ item.name }}</b>
                                        <small>{{ item.summary }}</small>
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3>Components</h3>
                        <ul class="tpl-components">
                            <li v-for="item in used" :key="item.name">
                                <a v-if="item.id" :href="`#/components/${item.id}`">{{ item.name }}</a>
                                <span v-else>{{ item.name }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <section class="home-band home-band-muted" aria-labelledby="template-faq">
            <div class="home-wrap tpl-faq">
                <header class="home-head">
                    <h2 id="template-faq">Questions</h2>
                    <p>About {{ entry.name }}, and about templates in general.</p>
                </header>
                <Accordion v-model:value="faq" :heading-level="3">
                    <AccordionPanel v-for="(item, i) in entry.faq" :key="item.question" :value="String(i)">
                        <AccordionHeader>{{ item.question }}</AccordionHeader>
                        <AccordionContent>
                            <p class="tpl-faq-answer">{{ item.answer }}</p>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </div>
        </section>

        <nav class="home-wrap tpl-pager" aria-label="More templates">
            <a :href="`#/templates/${previous.id}`">
                <small>Previous</small>
                <b>{{ previous.name }}</b>
            </a>
            <a href="#/templates" class="tpl-pager-all">All templates</a>
            <a :href="`#/templates/${next.id}`" class="next">
                <small>Next</small>
                <b>{{ next.name }}</b>
            </a>
        </nav>
    </main>

    <main v-else class="home">
        <section class="home-band">
            <div class="home-wrap home-head">
                <h1>No template called “{{ route.id }}”</h1>
                <p>It may have been renamed.</p>
                <Button as="a" href="#/templates" label="See all templates" />
            </div>
        </section>
    </main>
</template>
