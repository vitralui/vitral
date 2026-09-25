<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue';
import { track } from './lib/analytics';
import { entryOf, sectionText } from './lib/catalog';
import { t } from './lib/i18n';
import { route } from './lib/router';
import { demoSourcesKey, slugify } from './lib/section';
import CodeBlock from './parts/CodeBlock.vue';

/**
 * One example on a component's page: a heading and a line about it, then a
 * card with the thing running and its code under it. The first lines of the
 * code show through a fade, enough to see what it is made of; the whole of it
 * is one press away, and the file it is read from is the file the reader
 * copies.
 */
const props = defineProps<{ title: string; description?: string }>();

const sources = inject(demoSourcesKey, null);
const code = computed(() => sources?.value.get(props.title));
const open = ref(false);
const codeId = useId();

function toggle() {
    open.value = !open.value;
    if (open.value) track('view_code', { component: route.value.id, section: props.title });
}
// The English title is the section's anchor and the key its markup is found
// by; what is shown is its translation, when the page has one.
const text = computed(() => sectionText(entryOf(route.value.id), props.title, props.description));
</script>

<template>
    <section :id="slugify(title)" class="demo-section">
        <header>
            <h3>{{ text.title }}</h3>
            <p v-if="text.description">{{ text.description }}</p>
        </header>
        <div class="demo-card">
            <div class="demo-body">
                <slot />
            </div>
            <div v-if="code" :id="codeId" class="demo-code" :class="{ 'demo-code-open': open }">
                <!-- Folded, the code is a glimpse: not a place to tab into. -->
                <CodeBlock :code="code.code" :label="code.label" lang="vue" bare numbered :inert="!open || undefined" />
                <button class="demo-code-toggle" type="button" :aria-expanded="open" :aria-controls="codeId" @click="toggle">
                    {{ open ? t('Hide code') : t('View code') }}
                </button>
            </div>
        </div>
    </section>
</template>
