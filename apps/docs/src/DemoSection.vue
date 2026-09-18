<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { demoSourcesKey, slugify } from './lib/section';
import CodeBlock from './parts/CodeBlock.vue';

/**
 * One example on a component's page: a heading, the thing running, and — on
 * request — the markup that produced it, read out of this very file.
 */
const props = defineProps<{ title: string; description?: string }>();

const sources = inject(demoSourcesKey, null);
const code = computed(() => sources?.value.get(props.title));
const open = ref(false);
</script>

<template>
    <section :id="slugify(title)" class="demo-section">
        <header>
            <div>
                <h3>{{ title }}</h3>
                <p v-if="description">{{ description }}</p>
            </div>
            <div v-if="code" class="demo-tools">
                <button class="copy-btn" type="button" :aria-expanded="open" @click="open = !open">{{ open ? 'Hide code' : 'Code' }}</button>
            </div>
        </header>
        <div class="demo-body">
            <slot />
        </div>
        <CodeBlock v-if="open && code" :code="code" label="template" lang="vue" />
    </section>
</template>
