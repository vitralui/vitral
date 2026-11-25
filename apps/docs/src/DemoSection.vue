<script setup lang="ts">
import { Button, Tooltip as vTooltip } from '@vitral/vue';
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

/*
 * The example at a phone's width or a tablet's, and right to left: what a
 * reader would otherwise see only by narrowing the window or switching the
 * site's language. The width is the example's box, so a component that
 * answers to its own width (a grid that turns into cards, a side bar that
 * becomes a drawer) answers here; one that reads the window's media queries
 * does not.
 */
const widths = [
    { key: 'phone', icon: 'smartphone', label: 'Phone width', px: 390 },
    { key: 'tablet', icon: 'tablet', label: 'Tablet width', px: 768 },
    { key: 'full', icon: 'monitor', label: 'Full width', px: 0 }
] as const;
const width = ref<(typeof widths)[number]['key']>('full');
const framed = computed(() => widths.find((w) => w.key === width.value)!.px);
const rtl = ref(false);
function setWidth(key: (typeof widths)[number]['key']) {
    width.value = key;
    if (key !== 'full') track('demo_width', { component: route.value.id, section: props.title, width: key });
}

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
            <div class="demo-tools" role="toolbar" :aria-label="t('View the example')">
                <Button
                    v-for="option in widths"
                    :key="option.key"
                    v-tooltip.bottom="t(option.label)"
                    :icon="option.icon"
                    :aria-label="t(option.label)"
                    :aria-pressed="width === option.key"
                    :class="{ 'is-on': width === option.key }"
                    variant="text"
                    size="small"
                    severity="secondary"
                    @click="setWidth(option.key)"
                />
                <span class="demo-tools-rule" aria-hidden="true" />
                <Button
                    v-tooltip.bottom="t('Right to left')"
                    icon="pilcrowLeft"
                    :aria-label="t('Right to left')"
                    :aria-pressed="rtl"
                    :class="{ 'is-on': rtl }"
                    variant="text"
                    size="small"
                    severity="secondary"
                    @click="rtl = !rtl"
                />
            </div>
            <div class="demo-stage" :class="{ 'is-framed': framed }">
                <div class="demo-body" :dir="rtl ? 'rtl' : undefined" :style="framed ? { width: `${framed}px` } : undefined">
                    <slot />
                </div>
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
