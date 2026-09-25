<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue';
import { guideOf, guides, guideText, sectionName } from '../lib/guides';
import { lang, proseScope, t } from '../lib/i18n';
import { route, href } from '../lib/router';
import { slugify } from '../lib/section';
import PageEnd from '../parts/PageEnd.vue';
import Toc from '../parts/Toc.vue';

const guide = computed(() => guideOf(route.value.id) ?? guides[0]!);
const body = ref<HTMLElement | null>(null);

// The guide's `<T>` blocks read their translations from its own file.
provide(proseScope, computed(() => `guides/${guide.value.id}`));
const toc = ref<{ id: string; label: string }[]>([]);

/**
 * The guides are written as prose, not as data, so the outline is read back
 * off the rendered page: every `h2` gets an id from its own text and a line in
 * "on this page". Nothing to keep in step by hand.
 */
async function collectHeadings() {
    await nextTick();
    const headings = Array.from(body.value?.querySelectorAll('h2') ?? []);
    toc.value = headings.map((heading) => {
        // Recomputed every time: a heading keeps its element when the page
        // changes language, and would otherwise keep the other language's id.
        const id = slugify(heading.textContent ?? '');
        heading.id = id;
        return { id, label: heading.textContent ?? '' };
    });
}

onMounted(collectHeadings);
// The same page in the other language has other headings.
watch(() => [route.value.path, lang.value], collectHeadings);

const index = computed(() => guides.findIndex((item) => item.id === guide.value.id));
const previous = computed(() => guides[index.value - 1]);
const next = computed(() => guides[index.value + 1]);
const text = computed(() => guideText(guide.value));
</script>

<template>
    <div class="doc-main">
        <div class="doc-head">
            <span class="eyebrow">{{ sectionName(guide.meta.section) }}</span>
            <h1>{{ text.title }}</h1>
            <p>{{ text.description }}</p>
        </div>

        <div ref="body" class="prose">
            <component :is="guide.component" :key="guide.id" />
        </div>

        <!-- The installation guide is the thing this would point at. -->
        <PageEnd :install="guide.id !== 'installation'" />

        <nav class="pager" :aria-label="t('Guides')">
            <a v-if="previous" :href="href(`/docs/${previous.id}`)"><span>{{ t('Previous') }}</span>{{ guideText(previous).title }}</a>
            <a v-if="next" class="next" :href="href(`/docs/${next.id}`)"><span>{{ t('Next') }}</span>{{ guideText(next).title }}</a>
        </nav>
    </div>

    <Toc :items="toc" />
</template>
