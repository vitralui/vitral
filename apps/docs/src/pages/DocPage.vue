<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { guideOf, guides } from '../lib/guides';
import { route } from '../lib/router';
import { slugify } from '../lib/section';
import Toc from '../parts/Toc.vue';

const guide = computed(() => guideOf(route.value.id) ?? guides[0]!);
const body = ref<HTMLElement | null>(null);
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
        const id = heading.id || slugify(heading.textContent ?? '');
        heading.id = id;
        return { id, label: heading.textContent ?? '' };
    });
}

onMounted(collectHeadings);
watch(() => route.value.path, collectHeadings);

const index = computed(() => guides.findIndex((item) => item.id === guide.value.id));
const previous = computed(() => guides[index.value - 1]);
const next = computed(() => guides[index.value + 1]);
</script>

<template>
    <div class="doc-main">
        <div class="doc-head">
            <span class="eyebrow">{{ guide.meta.section }}</span>
            <h1>{{ guide.meta.title }}</h1>
            <p>{{ guide.meta.description }}</p>
        </div>

        <div ref="body" class="prose">
            <component :is="guide.component" :key="guide.id" />
        </div>

        <nav class="pager" aria-label="Guides">
            <a v-if="previous" :href="`#/docs/${previous.id}`"><span>Previous</span>{{ previous.meta.title }}</a>
            <a v-if="next" class="next" :href="`#/docs/${next.id}`"><span>Next</span>{{ next.meta.title }}</a>
        </nav>
    </div>

    <Toc :items="toc" />
</template>
